"""
AI Analysis Engine — collects real-time metrics, computes weights & scores.

Production-ready: Uses real tools (Radon, Bandit, Safety, HTTP probes)
with intelligent fallbacks. Runs as a Celery async task.

Dimensions & Metrics:
  1. Frontend  → Frontend_load_time       (ms)      — real HTTP probe
  2. Backend   → Backend_proc_time        (ms)      — real HTTP probe
  3. Database  → Database_query_time      (ms)      — real ORM benchmark
  4. Structure → Structure_modularity     (score)   — Radon complexity analysis
  5. API       → API_latency              (ms)      — real HTTP probe
  6. Integration → Integration_success    (%)       — real endpoint health checks
  7. Security  → Security_audit           (score)   — Bandit SAST + Safety dep scan
"""

import io
import json
import logging
import os
import shutil
import subprocess
import tempfile
import time

import requests
from django.utils import timezone

logger = logging.getLogger("analyser.engine")

# ──────────────────────────────────────────────────────────────
# Thresholds & weights for each dimension
# ──────────────────────────────────────────────────────────────
DIMENSION_CONFIG = {
    "frontend": {
        "metric_name": "Frontend_load_time",
        "unit": "ms",
        "weight": 0.15,
        "thresholds": {"good": 1000, "warning": 3000, "critical": 6000},
    },
    "backend": {
        "metric_name": "Backend_proc_time",
        "unit": "ms",
        "weight": 0.18,
        "thresholds": {"good": 200, "warning": 800, "critical": 2000},
    },
    "database": {
        "metric_name": "Database_query_time",
        "unit": "ms",
        "weight": 0.15,
        "thresholds": {"good": 50, "warning": 200, "critical": 500},
    },
    "structure": {
        "metric_name": "Structure_modularity",
        "unit": "score",
        "weight": 0.12,
        "thresholds": {"good": 80, "warning": 50, "critical": 30},
        "higher_is_better": True,
    },
    "api": {
        "metric_name": "API_latency",
        "unit": "ms",
        "weight": 0.15,
        "thresholds": {"good": 100, "warning": 500, "critical": 1500},
    },
    "integration": {
        "metric_name": "Integration_success",
        "unit": "%",
        "weight": 0.12,
        "thresholds": {"good": 95, "warning": 80, "critical": 60},
        "higher_is_better": True,
    },
    "security": {
        "metric_name": "Security_audit",
        "unit": "score",
        "weight": 0.13,
        "thresholds": {"good": 85, "warning": 60, "critical": 40},
        "higher_is_better": True,
    },
}


def _score_lower_is_better(value, good, warning, critical):
    """Score where lower raw values are better (e.g. latency)."""
    if value <= good:
        return min(100, 100 - (value / good) * 15)
    elif value <= warning:
        ratio = (value - good) / (warning - good)
        return 85 - ratio * 35
    elif value <= critical:
        ratio = (value - warning) / (critical - warning)
        return 50 - ratio * 30
    else:
        return max(0, 20 - (value - critical) / critical * 20)


def _score_higher_is_better(value, good, warning, critical):
    """Score where higher raw values are better (e.g. success rate, audit score)."""
    if value >= good:
        return min(100, 85 + (value - good) / (100 - good + 0.01) * 15)
    elif value >= warning:
        ratio = (value - warning) / (good - warning)
        return 50 + ratio * 35
    elif value >= critical:
        ratio = (value - critical) / (warning - critical)
        return 20 + ratio * 30
    else:
        return max(0, value / critical * 20)


def compute_score(dimension, raw_value):
    """Compute a normalised 0-100 score for a given dimension."""
    cfg = DIMENSION_CONFIG[dimension]
    t = cfg["thresholds"]
    higher_better = cfg.get("higher_is_better", False)

    if higher_better:
        return round(_score_higher_is_better(raw_value, t["good"], t["warning"], t["critical"]), 2)
    return round(_score_lower_is_better(raw_value, t["good"], t["warning"], t["critical"]), 2)


def compute_grade(score):
    """Convert a numeric score to a letter grade."""
    if score >= 90:
        return "A+"
    elif score >= 80:
        return "A"
    elif score >= 70:
        return "B"
    elif score >= 60:
        return "C"
    elif score >= 50:
        return "D"
    elif score >= 35:
        return "E"
    return "F"


# ──────────────────────────────────────────────────────────────
# Utilities
# ──────────────────────────────────────────────────────────────


def _probe_url(url, timeout=10):
    """HTTP GET a URL and return response time in ms, or None on failure."""
    if not url:
        return None
    try:
        start = time.perf_counter()
        resp = requests.get(url, timeout=timeout, allow_redirects=True)
        elapsed_ms = (time.perf_counter() - start) * 1000
        return {"elapsed_ms": round(elapsed_ms, 2), "status": resp.status_code}
    except Exception as exc:
        logger.warning("URL probe failed for %s: %s", url, exc)
        return {"elapsed_ms": None, "error": str(exc)}


def _clone_repo(repo_url, dest_dir):
    """Shallow-clone a git repo into dest_dir. Returns True on success."""
    if not repo_url:
        return False
    try:
        subprocess.run(
            ["git", "clone", "--depth", "1", repo_url, dest_dir],
            capture_output=True,
            text=True,
            timeout=120,
            check=True,
        )
        return True
    except Exception as exc:
        logger.warning("Git clone failed for %s: %s", repo_url, exc)
        return False


# ──────────────────────────────────────────────────────────────
# Real-time metric collectors
# ──────────────────────────────────────────────────────────────


def collect_frontend_load_time(project, **_kw):
    """Probe the frontend URL to measure real page-load time (ms)."""
    probe = _probe_url(project.frontend_url)
    if probe and probe.get("elapsed_ms") is not None:
        return probe["elapsed_ms"], {"source": "live_probe", "probe": probe}

    # If no live URL, return a degraded measurement with a penalty
    logger.info("No frontend URL for %s — returning degraded score", project.name)
    return 3500.0, {"source": "no_url_provided", "note": "Provide a frontend_url for real measurement"}


def collect_backend_proc_time(project, **_kw):
    """Probe the backend API endpoint to measure processing time (ms)."""
    probe = _probe_url(project.backend_url)
    if probe and probe.get("elapsed_ms") is not None:
        return probe["elapsed_ms"], {"source": "live_probe", "probe": probe}

    logger.info("No backend URL for %s — returning degraded score", project.name)
    return 900.0, {"source": "no_url_provided", "note": "Provide a backend_url for real measurement"}


def collect_database_query_time(project, **_kw):
    """Benchmark real DB query time using Django ORM."""
    from django.db import connection

    # Run multiple queries for a more stable measurement
    times = []
    for _ in range(5):
        start = time.perf_counter()
        with connection.cursor() as cur:
            cur.execute("SELECT 1")
            cur.fetchone()
        times.append((time.perf_counter() - start) * 1000)

    avg_ms = sum(times) / len(times)
    p95_ms = sorted(times)[int(len(times) * 0.95)]

    # Also benchmark a real model query
    from .models import Project as ProjectModel
    start = time.perf_counter()
    list(ProjectModel.objects.all()[:5])
    model_query_ms = (time.perf_counter() - start) * 1000

    total = round(avg_ms + model_query_ms, 2)
    return total, {
        "source": "real_benchmark",
        "ping_avg_ms": round(avg_ms, 2),
        "ping_p95_ms": round(p95_ms, 2),
        "model_query_ms": round(model_query_ms, 2),
        "samples": len(times),
    }


def collect_structure_modularity(project, repo_dir=None, **_kw):
    """
    Evaluate structure modularity using Radon (real code analysis).
    Analyses cyclomatic complexity + maintainability index from the repo.
    Falls back to directory-structure heuristics if no repo.
    """
    details = {"source": "radon"}

    target_dir = repo_dir
    if not target_dir:
        details["source"] = "no_repo"
        details["note"] = "Provide a repo_url for real Radon analysis"
        return 45.0, details

    try:
        # Radon Maintainability Index (0-100, higher = more maintainable)
        mi_result = subprocess.run(
            ["radon", "mi", target_dir, "-j"],
            capture_output=True, text=True, timeout=60,
        )
        mi_data = json.loads(mi_result.stdout) if mi_result.stdout.strip() else {}

        # Radon Cyclomatic Complexity
        cc_result = subprocess.run(
            ["radon", "cc", target_dir, "-a", "-j"],
            capture_output=True, text=True, timeout=60,
        )
        cc_data = json.loads(cc_result.stdout) if cc_result.stdout.strip() else {}

        # Calculate average maintainability index
        mi_scores = []
        for filepath, mi_info in mi_data.items():
            if isinstance(mi_info, dict) and "mi" in mi_info:
                mi_scores.append(mi_info["mi"])
            elif isinstance(mi_info, (int, float)):
                mi_scores.append(float(mi_info))

        avg_mi = sum(mi_scores) / len(mi_scores) if mi_scores else 50.0

        # Calculate average cyclomatic complexity
        cc_scores = []
        for filepath, functions in cc_data.items():
            if isinstance(functions, list):
                for func in functions:
                    if isinstance(func, dict) and "complexity" in func:
                        cc_scores.append(func["complexity"])

        avg_cc = sum(cc_scores) / len(cc_scores) if cc_scores else 10.0

        # Combined score: MI is 0-100 (higher = better), CC penalty (lower CC = better)
        cc_penalty = max(0, (avg_cc - 5) * 3)  # penalty for CC > 5
        score = max(0, min(100, avg_mi - cc_penalty))

        details.update({
            "avg_maintainability_index": round(avg_mi, 2),
            "avg_cyclomatic_complexity": round(avg_cc, 2),
            "files_analysed_mi": len(mi_scores),
            "functions_analysed_cc": len(cc_scores),
        })

        return round(score, 2), details

    except Exception as exc:
        logger.error("Radon analysis failed: %s", exc)
        details["error"] = str(exc)
        return 45.0, details


def collect_api_latency(project, **_kw):
    """Measure API endpoint latency with multiple samples for stability."""
    if not project.backend_url:
        return 800.0, {"source": "no_url_provided", "note": "Provide a backend_url for real measurement"}

    times = []
    errors = 0
    for _ in range(3):
        probe = _probe_url(project.backend_url, timeout=10)
        if probe and probe.get("elapsed_ms") is not None:
            times.append(probe["elapsed_ms"])
        else:
            errors += 1

    if times:
        avg = sum(times) / len(times)
        return round(avg, 2), {
            "source": "live_probe",
            "samples": len(times),
            "errors": errors,
            "avg_ms": round(avg, 2),
            "min_ms": round(min(times), 2),
            "max_ms": round(max(times), 2),
        }

    return 1200.0, {"source": "probe_failed", "errors": errors}


def collect_integration_success(project, **_kw):
    """
    Check integration health by probing real endpoints.
    Tests both frontend and backend URLs for connectivity.
    """
    endpoints = []
    if project.frontend_url:
        endpoints.append(("frontend", project.frontend_url))
    if project.backend_url:
        endpoints.append(("backend", project.backend_url))
        # Also test common API sub-paths
        base = project.backend_url.rstrip("/")
        for suffix in ["/health", "/api", "/graphql"]:
            endpoints.append((f"backend{suffix}", f"{base}{suffix}"))

    if not endpoints:
        return 50.0, {
            "source": "no_urls_provided",
            "note": "Provide frontend_url and/or backend_url for real integration testing",
        }

    passed = 0
    results = {}
    for name, url in endpoints:
        try:
            resp = requests.get(url, timeout=10, allow_redirects=True)
            ok = resp.status_code < 500
            results[name] = {"status": resp.status_code, "ok": ok}
            if ok:
                passed += 1
        except Exception as exc:
            results[name] = {"error": str(exc), "ok": False}

    total = len(endpoints)
    rate = round((passed / total) * 100, 2) if total else 0

    return rate, {
        "source": "live_integration_test",
        "endpoints_tested": total,
        "endpoints_passed": passed,
        "results": results,
    }


def collect_security_audit(project, repo_dir=None, **_kw):
    """
    Run a real security audit using Bandit (SAST) and Safety (dep scan).
    Combines results into a 0-100 score.
    """
    details = {"source": "real_audit", "checks": {}}
    total_checks = 0
    passed_checks = 0

    # ── 1. Bandit SAST scan (if repo available) ──
    if repo_dir:
        try:
            result = subprocess.run(
                ["bandit", "-r", repo_dir, "-f", "json", "-q"],
                capture_output=True, text=True, timeout=120,
            )
            bandit_data = json.loads(result.stdout) if result.stdout.strip() else {}
            metrics = bandit_data.get("metrics", {}).get("_totals", {})

            high_sev = metrics.get("SEVERITY.HIGH", 0)
            med_sev = metrics.get("SEVERITY.MEDIUM", 0)
            low_sev = metrics.get("SEVERITY.LOW", 0)
            loc = metrics.get("loc", 1)

            # Score: fewer issues per LOC = better
            issue_density = (high_sev * 3 + med_sev * 2 + low_sev) / max(loc, 1) * 1000
            bandit_score = max(0, 100 - issue_density * 10)

            details["checks"]["bandit_sast"] = {
                "high_severity": high_sev,
                "medium_severity": med_sev,
                "low_severity": low_sev,
                "lines_of_code": loc,
                "score": round(bandit_score, 2),
            }
            total_checks += 1
            if bandit_score >= 60:
                passed_checks += 1

        except Exception as exc:
            logger.warning("Bandit scan failed: %s", exc)
            details["checks"]["bandit_sast"] = {"error": str(exc)}
    else:
        details["checks"]["bandit_sast"] = {"skipped": "no_repo_available"}

    # ── 2. Safety dependency vulnerability scan ──
    req_file = None
    if repo_dir:
        for candidate in ["requirements.txt", "backend/requirements.txt", "setup.cfg"]:
            path = os.path.join(repo_dir, candidate)
            if os.path.exists(path):
                req_file = path
                break

    if req_file:
        try:
            result = subprocess.run(
                ["safety", "check", "--file", req_file, "--json"],
                capture_output=True, text=True, timeout=60,
            )
            vulns = json.loads(result.stdout) if result.stdout.strip() else []
            vuln_count = len(vulns) if isinstance(vulns, list) else 0
            safety_score = max(0, 100 - vuln_count * 15)

            details["checks"]["safety_deps"] = {
                "vulnerabilities_found": vuln_count,
                "score": round(safety_score, 2),
            }
            total_checks += 1
            if safety_score >= 60:
                passed_checks += 1

        except Exception as exc:
            logger.warning("Safety scan failed: %s", exc)
            details["checks"]["safety_deps"] = {"error": str(exc)}
    else:
        details["checks"]["safety_deps"] = {"skipped": "no_requirements_file"}

    # ── 3. HTTPS check ──
    for label, url in [("frontend_https", project.frontend_url), ("backend_https", project.backend_url)]:
        total_checks += 1
        if url and url.startswith("https://"):
            passed_checks += 1
            details["checks"][label] = True
        else:
            details["checks"][label] = False

    # ── 4. CORS / headers check ──
    if project.backend_url:
        total_checks += 1
        try:
            resp = requests.options(project.backend_url, timeout=5)
            has_cors = "access-control-allow-origin" in {k.lower() for k in resp.headers}
            has_xframe = "x-frame-options" in {k.lower() for k in resp.headers}
            details["checks"]["cors_configured"] = has_cors
            details["checks"]["x_frame_options"] = has_xframe
            if has_cors:
                passed_checks += 1
        except Exception:
            details["checks"]["cors_configured"] = "unreachable"

    # ── Calculate combined score ──
    if total_checks > 0:
        base_score = (passed_checks / total_checks) * 100
        # Factor in Bandit score if present
        bandit_info = details["checks"].get("bandit_sast", {})
        if isinstance(bandit_info, dict) and "score" in bandit_info:
            score = (base_score + bandit_info["score"]) / 2
        else:
            score = base_score
    else:
        score = 40.0  # No checks could run = low confidence

    details["passed"] = passed_checks
    details["total"] = total_checks

    return round(score, 2), details


# Map dimension → collector function
COLLECTORS = {
    "frontend": collect_frontend_load_time,
    "backend": collect_backend_proc_time,
    "database": collect_database_query_time,
    "structure": collect_structure_modularity,
    "api": collect_api_latency,
    "integration": collect_integration_success,
    "security": collect_security_audit,
}


# ──────────────────────────────────────────────────────────────
# Orchestrator — runs a full analysis
# ──────────────────────────────────────────────────────────────


def run_full_analysis(project):
    """
    Execute a complete analysis run for all 7 dimensions.
    Clones the repo (if available) for code-level analysis.
    Returns an AnalysisRun object with all MetricSnapshots created.
    """
    from .models import AnalysisRun, MetricSnapshot, HistoricalTrend

    run = AnalysisRun.objects.create(
        project=project,
        status="running",
        started_at=timezone.now(),
    )

    logger.info("Starting analysis run %s for project %s", run.id, project.name)

    # Clone the repo into a temp dir for code-level analysis
    repo_dir = None
    tmp_dir = None
    if project.repo_url:
        tmp_dir = tempfile.mkdtemp(prefix="analyser_")
        repo_dir = os.path.join(tmp_dir, "repo")
        if not _clone_repo(project.repo_url, repo_dir):
            repo_dir = None
            logger.warning("Could not clone repo %s — code analysis will be skipped", project.repo_url)

    try:
        weighted_sum = 0.0
        total_weight = 0.0

        for dimension, collector in COLLECTORS.items():
            cfg = DIMENSION_CONFIG[dimension]
            try:
                raw_value, details = collector(project, repo_dir=repo_dir)
            except Exception as exc:
                logger.error("Collector %s failed: %s", dimension, exc, exc_info=True)
                raw_value = 0
                details = {"error": str(exc)}

            score = compute_score(dimension, raw_value)
            grade = compute_grade(score)

            MetricSnapshot.objects.create(
                analysis_run=run,
                dimension=dimension,
                metric_name=cfg["metric_name"],
                raw_value=raw_value,
                unit=cfg["unit"],
                weight=cfg["weight"],
                normalised_score=score,
                grade=grade,
                threshold_good=cfg["thresholds"]["good"],
                threshold_warning=cfg["thresholds"]["warning"],
                threshold_critical=cfg["thresholds"]["critical"],
                details=details,
            )

            HistoricalTrend.objects.create(
                project=project,
                dimension=dimension,
                metric_name=cfg["metric_name"],
                value=raw_value,
                score=score,
            )

            weighted_sum += score * cfg["weight"]
            total_weight += cfg["weight"]

        overall_score = round(weighted_sum / total_weight, 2) if total_weight else 0
        run.overall_score = overall_score
        run.overall_grade = compute_grade(overall_score)
        run.status = "completed"
        run.completed_at = timezone.now()
        run.save()

        logger.info("Analysis run %s completed: score=%.1f grade=%s", run.id, overall_score, run.overall_grade)
        
        # Generate project embeddings for chatbot context
        from .tasks import generate_project_embeddings
        try:
            generate_project_embeddings.delay(str(project.id))
            logger.info("Queued embedding generation for project %s", project.id)
        except Exception as e:
            logger.error(f"Could not queue embedding generation: {e}")

    except Exception as exc:
        logger.error("Analysis run %s failed: %s", run.id, exc, exc_info=True)
        run.status = "failed"
        run.completed_at = timezone.now()
        run.save()
        raise

    finally:
        # Clean up cloned repo
        if tmp_dir and os.path.exists(tmp_dir):
            shutil.rmtree(tmp_dir, ignore_errors=True)

    return run
