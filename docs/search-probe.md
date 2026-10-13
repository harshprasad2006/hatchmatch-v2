# Search Grounding Probe Results

- **Probe Timestamp (UTC)**: `2026-10-12T18:09:52.746725+00:00`
- **Prompt Tested**: `What are commercial tools for tracking household electricity consumption in India? List 2 examples.`
- **Probe Policy**: Single request per model, no retries to conserve quota.

## Results Table

| Model | Status | Grounding Metadata | Citations Returned | Citation Count | Error Summary |
|---|---|---|---|---|---|
| `gemini-3.8-flash` | ❌ FAILED | No | No | 0 | `429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'You exceeded your cu...` |

## Detailed Probe Logs (Full Untruncated Errors)

### Model: `gemini-3.8-flash`
- **Success**: `False`
- **Grounding Metadata Present**: `False`
- **Citations Returned**: `False` (count: 0)
- **FULL Raw Error Text**:
```text
429 RESOURCE_EXHAUSTED. {'error': {'code': 429, 'message': 'You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. ', 'status': 'RESOURCE_EXHAUSTED', 'details': [{'@type': 'type.googleapis.com/google.rpc.Help', 'links': [{'description': 'Learn more about Gemini API quotas', 'url': 'https://ai.google.dev/gemini-api/docs/rate-limits'}]}]}}
```

## Ready-to-Send Message to Hackathon Organizers

```text
Subject: Query regarding Google Cloud / Gemini API credits for Hackathon Project (HatchMatch)

Hi Organizing Team,

We are building "HatchMatch", a platform connecting student builders with real-world problems. Our backend leverages Gemini for problem structuring and search grounding (checking existing solutions/patents/products).

Under Google AI Studio's free tier, search grounding and high-frequency model calls quickly encounter strict rate limits (429 Resource Exhausted) and daily quota caps. 

Could you please let us know if:
1. Google Cloud / Vertex AI credits or promo codes are provided for participating teams?
2. Alternatively, are higher-tier Gemini API keys or project whitelisting available for the hackathon?

This will help us determine whether to run grounded search in live evaluation or fall back to our zero-quota search pipelines.

Thank you!
Team HatchMatch
```
