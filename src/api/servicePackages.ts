/**
 * Service Packages API Client (Alias)
 * @deprecated Use packagesApi instead
 */
import { packagesApi, type Package, type PackageStats, type PackageFilters } from './packagesApi';

// Re-export main API
export const servicePackages = packagesApi;

// Legacy function names for backward compatibility
export const getAllServicePackages = packagesApi.getAll;
export const getServicePackageById = packagesApi.getById;
export const createServicePackage = packagesApi.create;
export const updateServicePackage = packagesApi.update;
export const deleteServicePackage = packagesApi.delete;
export const getServicePackageStats = packagesApi.getStats;
export const cloneServicePackage = packagesApi.clone;

// Re-export types
export type ServicePackage = Package;
export type ServicePackageStats = PackageStats;
export type ServicePackageFilters = PackageFilters;

export default servicePackages;