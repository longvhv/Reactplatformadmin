/**
 * ✅ MIGRATED from /pages/roles/create.tsx
 */
'use client';

import React, { useState } from 'react';
import { useRouter } from '../../../../../components/shim/next-navigation';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '../../../../../components/ui/button';
import { PageLayout } from '../../../../../components/layout/PageLayout';
import { RoleForm } from '../../../../../components/roles/RoleForm';
import { useRoles } from '../../../../../hooks/useRoles';
import { CreateRoleRequest } from '../../../../../api/rolesApi';
import { showToast } from '../../../../../lib/toast';
import { useAuthContext } from '../../../../../providers/AuthProvider';