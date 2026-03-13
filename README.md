# LinkedIn Job Matching AI Agent

An AI-powered automation system that continuously monitors LinkedIn job postings and evaluates how well they match my background.

When a highly relevant opportunity appears, the system automatically sends an email notification.

## Motivation

While preparing for my next career step in the Netherlands, I realized that manually browsing LinkedIn for relevant job opportunities can be very time-consuming.

To solve this problem, I built an automation system that collects job postings, analyzes their relevance using AI, and sends notifications when a strong match appears.

## Workflow

LinkedIn Jobs → Apify API → n8n Workflow → AI Matching → JSON Parsing → Gmail Notification

## Tech Stack

- n8n
- Apify API
- JavaScript
- AI API
- Gmail API
- HTML
- VPS / Docker

## Project Structure

linkedin-job-matching-ai-agent
├── prompts
├── scripts
├── email
├── workflow
└── docs

## Future Improvements

- Support more job platforms
- Improve matching algorithm
- Store matched jobs in a database
