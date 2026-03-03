import os
import sys

__test__ = False


def main() -> int:
    import django
    import sentry_sdk
    from django.conf import settings

    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "project_analyser.settings")
    django.setup()

    print("=" * 60)
    print("SENTRY CONFIGURATION TEST")
    print("=" * 60)

    # Check if SENTRY_DSN is loaded
    print(f"\nSENTRY_DSN: {settings.SENTRY_DSN}")
    print(f"Length: {len(settings.SENTRY_DSN)}")
    print(f"Is enabled: {bool(settings.SENTRY_DSN)}")

    # Check Sentry SDK initialization
    print(f"\nSentry SDK Client: {sentry_sdk.Hub.current.client}")
    print(f"Sentry SDK initialized: {bool(sentry_sdk.Hub.current.client)}")

    # Check integrations
    if sentry_sdk.Hub.current.client:
        print(f"\nSentry Integrations: {sentry_sdk.Hub.current.client.integrations}")

    print("\n" + "=" * 60)
    if settings.SENTRY_DSN and sentry_sdk.Hub.current.client:
        print("✅ SENTRY IS ENABLED AND WORKING")
        return 0

    print("❌ SENTRY IS NOT ENABLED")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
