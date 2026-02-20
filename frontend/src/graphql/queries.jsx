import { gql } from '@apollo/client';

// ── Queries ───────────────────────────────────────────────────

export const GET_ALL_PROJECTS = gql`
  query GetAllProjects {
    allProjects {
      id
      name
      description
      repoUrl
      frontendUrl
      backendUrl
      createdAt
      latestRun {
        id
        status
        overallScore
        overallGrade
        completedAt
        metrics {
          dimension
          metricName
          rawValue
          unit
          weight
          normalisedScore
          grade
        }
      }
    }
  }
`;

export const GET_PROJECT_DETAIL = gql`
  query GetProjectDetail($id: UUID!) {
    project(id: $id) {
      id
      name
      description
      repoUrl
      frontendUrl
      backendUrl
      createdAt
      latestRun {
        id
        status
        overallScore
        overallGrade
        startedAt
        completedAt
        metrics {
          id
          dimension
          metricName
          rawValue
          unit
          weight
          normalisedScore
          grade
          thresholdGood
          thresholdWarning
          thresholdCritical
          detailsJson
          measuredAt
        }
      }
      analysisRuns {
        id
        status
        overallScore
        overallGrade
        completedAt
      }
      trends(limit: 100) {
        dimension
        metricName
        value
        score
        recordedAt
      }
    }
    dimensionConfigs {
      dimension
      metricName
      unit
      weight
      thresholdGood
      thresholdWarning
      thresholdCritical
      higherIsBetter
    }
  }
`;

export const GET_DIMENSION_CONFIGS = gql`
  query GetDimensionConfigs {
    dimensionConfigs {
      dimension
      metricName
      unit
      weight
      thresholdGood
      thresholdWarning
      thresholdCritical
      higherIsBetter
    }
  }
`;

// ── Mutations ─────────────────────────────────────────────────

export const CREATE_PROJECT = gql`
  mutation CreateProject(
    $name: String!
    $description: String
    $repoUrl: String
    $frontendUrl: String
    $backendUrl: String
  ) {
    createProject(
      name: $name
      description: $description
      repoUrl: $repoUrl
      frontendUrl: $frontendUrl
      backendUrl: $backendUrl
    ) {
      project {
        id
        name
      }
    }
  }
`;

export const DELETE_PROJECT = gql`
  mutation DeleteProject($id: UUID!) {
    deleteProject(id: $id) {
      success
    }
  }
`;

export const RUN_ANALYSIS = gql`
  mutation RunAnalysis($projectId: UUID!) {
    runAnalysis(projectId: $projectId) {
      analysisRun {
        id
        status
        overallScore
        overallGrade
        completedAt
        metrics {
          id
          dimension
          metricName
          rawValue
          unit
          weight
          normalisedScore
          grade
          thresholdGood
          thresholdWarning
          thresholdCritical
          detailsJson
        }
      }
    }
  }
`;
