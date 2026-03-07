#!/bin/bash
# Add skills to Notion

NOTION_KEY=$(cat ~/.config/notion/api_key)
PAGE_ID="31acfd7f-86d5-81c2-afe8-f9d856a2e16e"

# Add todoist
 curl -s -X PATCH "https://api.notion.com/v1/blocks/$PAGE_ID/children" \
    -H "Authorization: Bearer $NOTION_KEY" \
    -H "Notion-Version: 2025-09-03" \
    -H "Content-Type: application/json" \
    -d '{"children":[{"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{"type":"text","text":{"content":"todoist"}}]}}]}' > /dev/null

# Add github
curl -s -X PATCH "https://api.notion.com/v1/blocks/$PAGE_ID/children" \
    -H "Authorization: Bearer $NOTION_KEY" \
    -H "Notion-Version: 2025-09-03" \
    -H "Content-Type: application/json" \
    -d '{"children":[{"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{"type":"text","text":{"content":"github"}}]}}]}' > /dev/null

# Add skill-vetter
curl -s -X PATCH "https://api.notion.com/v1/blocks/$PAGE_ID/children" \
    -H "Authorization: Bearer $NOTION_KEY" \
    -H "Notion-Version: 2025-09-03" \
    -H "Content-Type: application/json" \
    -d '{"children":[{"object":"block","type":"bulleted_list_item","bulleted_list_item":{"rich_text":[{"type":"text","text":{"content":"skill-vetter"}}]}}]}' > /dev/null

echo "Added to Notion: todoist, github, skill-vetter"