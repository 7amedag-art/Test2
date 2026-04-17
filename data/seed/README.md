# Seed data directory

Drop your completed CSV files here. The import pipeline reads:

- `products.csv` — follow `data/templates/products_template.csv`
- `manufacturers.csv` — follow `data/templates/manufacturers_template.csv`
- `links.csv` — follow `data/templates/product_manufacturer_links_template.csv`

Then run:

```bash
pnpm import:products
# or with custom paths:
pnpm import:products --products ./my-products.csv --manufacturers ./my-mfrs.csv --links ./my-links.csv
# preview without writing:
pnpm import:products --dry-run
```

The importer is idempotent — re-running it updates existing rows matched by
`product_code` (products) and `manufacturer_name` (manufacturers).
