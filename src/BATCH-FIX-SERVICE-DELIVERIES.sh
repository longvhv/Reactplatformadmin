#!/bin/bash
# Batch fix all service-deliveries paths

# Replace in all files
find pages -name "*ServiceDeliver*.tsx" -type f -exec sed -i "s|'/core/service-deliveries|'/thuong-mai/giao-dich-vu|g" {} \;
find pages -name "*ServiceDeliver*.tsx" -type f -exec sed -i 's|"/core/service-deliveries|"/thuong-mai/giao-dich-vu|g' {} \;
find pages -name "*ServiceDeliver*.tsx" -type f -exec sed -i 's|`/core/service-deliveries|`/thuong-mai/giao-dich-vu|g' {} \;

echo "✅ Service Deliveries paths updated!"
