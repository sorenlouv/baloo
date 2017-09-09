# Export

## Dump mappings
elasticdump --input=http://localhost:9200/baloo --output=baloo_index_mapping.json --type=mapping

## Dump data
elasticdump --input=http://localhost:9200/baloo --output=baloo_index.json --type=data

# Import

## Mappings
elasticdump --input=baloo_index_mapping.json --output=http://localhost:9200/baloo --type=mapping

## Data
elasticdump --input=baloo_index.json --output=http://localhost:9200/baloo --type=data

