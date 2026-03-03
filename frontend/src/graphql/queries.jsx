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

export const TOKEN_AUTH = gql`
  mutation TokenAuth($username: String!, $password: String!) {
    tokenAuth(username: $username, password: $password) {
      token
    }
  }
`;

export const LOGIN_USER = gql`
  mutation LoginUser($username: String!, $password: String!) {
    loginUser(username: $username, password: $password) {
      success
      message
      token
    }
  }
`;

export const SEND_OTP = gql`
  mutation SendOTP($email: String!) {
    sendOtp(email: $email) {
      success
      message
    }
  }
`;

export const VERIFY_OTP = gql`
  mutation VerifyOTP($email: String!, $otpCode: String!) {
    verifyOtpMutation(email: $email, otpCode: $otpCode) {
      success
      message
    }
  }
`;

export const REGISTER_USER = gql`
  mutation RegisterUser($username: String!, $email: String!, $password: String!, $otpCode: String!) {
    registerUser(username: $username, email: $email, password: $password, otpCode: $otpCode) {
      success
      message
      token
    }
  }
`;

export const GOOGLE_AUTH = gql`
  mutation GoogleAuth($googleToken: String!) {
    googleAuth(googleToken: $googleToken) {
      success
      message
      email
      isNewUser
    }
  }
`;

export const VERIFY_GOOGLE_OTP = gql`
  mutation VerifyGoogleOTP($email: String!, $otpCode: String!) {
    verifyGoogleOtp(email: $email, otpCode: $otpCode) {
      success
      message
      token
    }
  }
`;

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
      success
      message
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
      success
      message
      asyncDispatched
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
export const GET_PROJECT_SUMMARY = gql`
  query GetProjectSummary($projectId: UUID!) {
    project(id: $projectId) {
      id
      summary {
        id
        summary
        generatedAt
        updatedAt
      }
    }
  }
`;

export const GET_PROJECT_CHAT_MESSAGES = gql`
  query GetProjectChatMessages($projectId: UUID!) {
    project(id: $projectId) {
      id
      chatMessages {
        id
        role
        content
        createdAt
      }
    }
  }
`;

export const GENERATE_PROJECT_SUMMARY = gql`
  mutation GenerateProjectSummary($projectId: UUID!) {
    generateProjectSummary(projectId: $projectId) {
      projectSummary {
        id
        summary
        generatedAt
      }
      success
      message
    }
  }
`;

export const SEND_CHAT_MESSAGE = gql`
  mutation SendChatMessage($projectId: UUID!, $message: String!) {
    sendChatMessage(projectId: $projectId, message: $message) {
      chatMessage {
        id
        role
        content
        createdAt
      }
      chatbotResponse
      success
    }
  }
`;

// ── Payment Mutations ───────────────────────────────────────────────────

export const CREATE_RAZORPAY_ORDER_MUTATION = gql`
  mutation CreateRazorpayOrder($planName: String!) {
    createRazorpayOrder(planName: $planName) {
      payment {
        id
        user {
          id
          email
        }
        plan {
          id
          name
          pricePerMonth
        }
        amount
        currency
        status
        razorpayOrderId
        razorpaySubscriptionId
        createdAt
      }
      orderId
      subscriptionId
      amount
      currency
      success
      message
    }
  }
`;

export const VERIFY_RAZORPAY_PAYMENT_MUTATION = gql`
  mutation VerifyRazorpayPayment(
    $razorpayPaymentId: String!
    $razorpaySignature: String!
    $razorpayOrderId: String
    $razorpaySubscriptionId: String
  ) {
    verifyRazorpayPayment(
      razorpayPaymentId: $razorpayPaymentId
      razorpaySignature: $razorpaySignature
      razorpayOrderId: $razorpayOrderId
      razorpaySubscriptionId: $razorpaySubscriptionId
    ) {
      payment {
        id
        status
        createdAt
        succeededAt
      }
      subscription {
        id
        plan {
          id
          name
          pricePerMonth
        }
        isActive
        projectsUsed
        projectsLimit
        analysesUsed
        analysesLimit
        renewsAt
      }
      success
      message
    }
  }
`;

export const GET_CURRENT_SUBSCRIPTION = gql`
  query GetCurrentSubscription {
    currentUser {
      id
      email
      subscription {
        id
        plan {
          id
          name
          pricePerMonth
          description
        }
        isActive
        projectsUsed
        projectsLimit
        analysesUsed
        analysesLimit
        renewsAt
        createdAt
      }
    }
  }
`;