"""
URL configuration for project_analyser.
GraphQL endpoint with JWT-based authentication (no csrf_exempt needed).
Razorpay webhook for payment processing.
"""
from django.contrib import admin
from django.urls import path
from graphene_django.views import GraphQLView
from django.views.decorators.csrf import csrf_exempt
from analyser.payment_views import razorpay_webhook, health_check


urlpatterns = [
    path("admin/", admin.site.urls),
    # csrf_exempt is acceptable here because we use JWT tokens (not cookies) for auth
    path("graphql/", csrf_exempt(GraphQLView.as_view(graphiql=True))),
    # Health check endpoint
    path("health/", health_check),
    # Razorpay webhook (must be csrf_exempt for Razorpay)
    path("webhook/razorpay/", razorpay_webhook),
]
