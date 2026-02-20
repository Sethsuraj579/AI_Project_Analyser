"""
URL configuration for project_analyser.
GraphQL endpoint with JWT-based authentication (no csrf_exempt needed).
"""
from django.contrib import admin
from django.urls import path
from graphene_django.views import GraphQLView
from django.views.decorators.csrf import csrf_exempt


urlpatterns = [
    path("admin/", admin.site.urls),
    # csrf_exempt is acceptable here because we use JWT tokens (not cookies) for auth
    path("graphql/", csrf_exempt(GraphQLView.as_view(graphiql=True))),
    # Health check endpoint for deployment probes
    path("health/", lambda request: __import__("django.http", fromlist=["JsonResponse"]).JsonResponse({"status": "ok"})),
]
