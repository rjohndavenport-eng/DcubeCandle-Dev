# SANDBOX CATALOG BLUEPRINT

## 1. FOLDER STRUCTURE
- `/theme-download/`: Explicit source code for Theme ID 160399261916.
- `/assets/theme_assets_raw/`: Unmodified original asset files.
- `/assets/theme_assets_normalized/`: Standardized naming/format copies.
- `/inventory/`: JSON/Markdown maps of products, pages, and navigation.

## 2. JSON SCHEMAS
### Theme Map Schema
```json
{
  "theme_id": "160399261916",
  "mappings": {
    "templates": ["index", "product", "collection"],
    "sections": ["header", "footer", "custom-section"],
    "snippets": ["product-card", "icon-bee"]
  }
}
```

## 3. SAFETY PROTOCOL
- All `shopify theme` commands MUST include `--theme 160399261916`.
- `shopify theme push` is forbidden unless explicitly requested for dev-branch updates.
- Checksums required for all logo/label assets before and after any operation.
