# CareerRoute API Testing Guide

## Overview
This directory contains comprehensive testing resources for the CareerRoute API, including Postman collections and test reports.

## Postman Collections

### 🔄 End-to-End Workflows
- **CareerRoute-E2E-MenteeFlow** - Complete mentee login and booking flow
- **CareerRoute-E2E-MentorFlow** - Complete mentor login and session management
- **CareerRoute-Payment-Flow** - Payment processing and Stripe integration testing

### ⚠️ Edge Cases
- **CareerRoute-NegativeTests** - Error handling, validation, and edge case scenarios



## Environment Setup

1. **Import Environment**: Load `CareerRoute-Local.postman_environment.json`
2. **Update Variables**:
   - `baseUrl`: Your local API URL (default: `http://localhost:5000`)
   - `authToken`: JWT token for authenticated requests
   - `apiKey`: API key if required

## Quick Start

### 1. Authentication
Start with the login endpoint to authenticate and get your JWT token.

### 2. Run Flows Sequentially
Execute collections in this order:
1. Payment-Flow (if testing payments)
2. MentorFlow or MenteeFlow
3. NegativeTests (for edge cases)

### 3. Monitor Variables
Collections use Postman variables for data sharing between requests.

## Prerequisites

### Local Development
- CareerRoute API running on `http://localhost:5000`
- Database seeded with test data
- SendGrid configured for emails
- Stripe test keys configured for payments

### User Roles
- **Mentee**: Login through API, book sessions
- **Mentor**: Login with mentor account, manage sessions

## Troubleshooting

### Common Issues
- **401 Unauthorized**: Update `authToken` in environment
- **404 Not Found**: Check `baseUrl` and API health
- **500 Internal Error**: Check server logs and configuration

### Data Reset
For consistent testing, reset test data between runs using the DB reset script.

## Running Tests

### Collection Runner
```bash
# Import all collections first
# Run E2E flows using Postman Collection Runner
```

### Newman (CI/CD)
```bash
newman run "CareerRoute-E2E-MenteeFlow.postman_collection.json" \
  -e "CareerRoute-Local.postman_environment.json"
```

## Notes
- Collections contain pre-request scripts for dynamic data
- Tests use response validation and chaining
- Environment variables persist between requests
