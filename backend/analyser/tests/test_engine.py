"""
Tests for the scoring engine — compute_score, compute_grade, and collectors.
"""
import pytest
from analyser.engine import (
    compute_score,
    compute_grade,
    _score_lower_is_better,
    _score_higher_is_better,
    DIMENSION_CONFIG,
    collect_database_query_time,
)
from .factories import ProjectFactory


# ──────────────────────────────────────────────────────────────
# Scoring function tests
# ──────────────────────────────────────────────────────────────


class TestScoreLowerIsBetter:
    """Tests for latency-style metrics (lower = better)."""

    def test_perfect_score(self):
        """Zero latency should give maximum score."""
        score = _score_lower_is_better(0, good=200, warning=800, critical=2000)
        assert score == 100

    def test_good_range(self):
        """Value within good threshold should score 85-100."""
        score = _score_lower_is_better(100, good=200, warning=800, critical=2000)
        assert 85 <= score <= 100

    def test_warning_range(self):
        """Value in warning range should score 50-85."""
        score = _score_lower_is_better(500, good=200, warning=800, critical=2000)
        assert 50 <= score <= 85

    def test_critical_range(self):
        """Value in critical range should score 20-50."""
        score = _score_lower_is_better(1500, good=200, warning=800, critical=2000)
        assert 20 <= score <= 50

    def test_beyond_critical(self):
        """Value beyond critical should score 0-20."""
        score = _score_lower_is_better(5000, good=200, warning=800, critical=2000)
        assert 0 <= score <= 20


class TestScoreHigherIsBetter:
    """Tests for success-rate / audit-style metrics (higher = better)."""

    def test_perfect_score(self):
        """100% should give near-maximum score."""
        score = _score_higher_is_better(100, good=95, warning=80, critical=60)
        assert score >= 85

    def test_good_range(self):
        """Value above good threshold."""
        score = _score_higher_is_better(97, good=95, warning=80, critical=60)
        assert score >= 85

    def test_warning_range(self):
        score = _score_higher_is_better(88, good=95, warning=80, critical=60)
        assert 50 <= score <= 85

    def test_below_critical(self):
        score = _score_higher_is_better(30, good=95, warning=80, critical=60)
        assert 0 <= score <= 20


class TestComputeScore:
    """Integration tests for compute_score across all dimensions."""

    @pytest.mark.parametrize("dimension", DIMENSION_CONFIG.keys())
    def test_all_dimensions_return_valid_range(self, dimension):
        """Every dimension should return a score between 0 and 100."""
        score = compute_score(dimension, 50)
        assert 0 <= score <= 100

    def test_frontend_good_load_time(self):
        score = compute_score("frontend", 500)  # 500ms is well under 1000 good
        assert score >= 80

    def test_backend_poor_proc_time(self):
        score = compute_score("backend", 5000)  # 5000ms is way beyond critical
        assert score < 30


class TestComputeGrade:
    def test_a_plus(self):
        assert compute_grade(95) == "A+"

    def test_a(self):
        assert compute_grade(82) == "A"

    def test_b(self):
        assert compute_grade(73) == "B"

    def test_c(self):
        assert compute_grade(65) == "C"

    def test_d(self):
        assert compute_grade(55) == "D"

    def test_e(self):
        assert compute_grade(40) == "E"

    def test_f(self):
        assert compute_grade(20) == "F"


# ──────────────────────────────────────────────────────────────
# Collector tests (real collectors — no mocking)
# ──────────────────────────────────────────────────────────────


@pytest.mark.django_db
class TestDatabaseCollector:
    """Tests for the real database collector."""

    def test_returns_positive_value(self):
        project = ProjectFactory()
        value, details = collect_database_query_time(project)
        assert value > 0
        assert details["source"] == "real_benchmark"
        assert "ping_avg_ms" in details
        assert details["samples"] == 5
