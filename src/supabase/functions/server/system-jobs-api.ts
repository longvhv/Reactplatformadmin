/**
 * System Jobs API Handlers
 * Full CRUD operations with Supabase integration
 */

import { Hono } from 'npm:hono';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const app = new Hono();

// Initialize Supabase client
const getSupabaseClient = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
};

// GET /system-jobs - List all jobs with filters
app.get('/system-jobs', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const url = new URL(c.req.url);
    
    // Get query parameters for filtering
    const searchQuery = url.searchParams.get('search') || '';
    const jobType = url.searchParams.get('type') || '';
    const status = url.searchParams.get('status') || '';
    const priority = url.searchParams.get('priority') || '';
    const isActive = url.searchParams.get('is_active');
    
    // Build query
    let query = supabase
      .from('system_jobs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (searchQuery) {
      query = query.or(`job_name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }
    if (jobType) {
      query = query.eq('job_type', jobType);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (isActive !== null && isActive !== '') {
      query = query.eq('is_active', isActive === 'true');
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching system jobs:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({
      data,
      count,
      success: true
    });
  } catch (error) {
    console.error('System jobs fetch error:', error);
    return c.json({ error: 'Failed to fetch system jobs' }, 500);
  }
});

// GET /system-jobs/:id - Get single job
app.get('/system-jobs/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    
    const { data, error } = await supabase
      .from('system_jobs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error(`Error fetching system job ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ data, success: true });
  } catch (error) {
    console.error('System job fetch error:', error);
    return c.json({ error: 'Failed to fetch system job' }, 500);
  }
});

// POST /system-jobs - Create new job
app.post('/system-jobs', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.job_name || !body.job_type || !body.status || !body.priority) {
      return c.json({ 
        error: 'Missing required fields: job_name, job_type, status, priority' 
      }, 400);
    }
    
    // Prepare data
    const jobData = {
      job_name: body.job_name,
      job_type: body.job_type,
      description: body.description || null,
      status: body.status,
      priority: body.priority,
      schedule_type: body.schedule_type || null,
      cron_expression: body.cron_expression || null,
      is_active: body.is_active !== undefined ? body.is_active : true,
      created_by: body.created_by || 'system',
      run_count: 0,
      success_count: 0,
      failure_count: 0,
    };
    
    const { data, error } = await supabase
      .from('system_jobs')
      .insert([jobData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating system job:', error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ 
      data, 
      success: true,
      message: 'Job created successfully' 
    }, 201);
  } catch (error) {
    console.error('System job creation error:', error);
    return c.json({ error: 'Failed to create system job' }, 500);
  }
});

// PUT /system-jobs/:id - Update job
app.put('/system-jobs/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Prepare update data (exclude auto-managed fields)
    const updateData: any = {};
    const allowedFields = [
      'job_name', 'job_type', 'description', 'status', 'priority',
      'schedule_type', 'cron_expression', 'is_active', 'last_run_at',
      'next_run_at', 'last_run_duration', 'last_run_status', 'last_run_error',
      'run_count', 'success_count', 'failure_count'
    ];
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });
    
    if (Object.keys(updateData).length === 0) {
      return c.json({ error: 'No fields to update' }, 400);
    }
    
    const { data, error } = await supabase
      .from('system_jobs')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating system job ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ 
      data, 
      success: true,
      message: 'Job updated successfully' 
    });
  } catch (error) {
    console.error('System job update error:', error);
    return c.json({ error: 'Failed to update system job' }, 500);
  }
});

// PATCH /system-jobs/:id/status - Update job status
app.patch('/system-jobs/:id/status', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    const body = await c.req.json();
    
    if (!body.status) {
      return c.json({ error: 'Status is required' }, 400);
    }
    
    const { data, error } = await supabase
      .from('system_jobs')
      .update({ status: body.status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating job status ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ 
      data, 
      success: true,
      message: 'Job status updated successfully' 
    });
  } catch (error) {
    console.error('Job status update error:', error);
    return c.json({ error: 'Failed to update job status' }, 500);
  }
});

// PATCH /system-jobs/:id/toggle-active - Toggle active status
app.patch('/system-jobs/:id/toggle-active', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    
    // First get current status
    const { data: currentJob, error: fetchError } = await supabase
      .from('system_jobs')
      .select('is_active')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      console.error(`Error fetching job ${id}:`, fetchError);
      return c.json({ error: fetchError.message }, fetchError.code === 'PGRST116' ? 404 : 500);
    }
    
    // Toggle the status
    const { data, error } = await supabase
      .from('system_jobs')
      .update({ is_active: !currentJob.is_active })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error toggling job active status ${id}:`, error);
      return c.json({ error: error.message }, 500);
    }
    
    return c.json({ 
      data, 
      success: true,
      message: `Job ${data.is_active ? 'activated' : 'deactivated'} successfully` 
    });
  } catch (error) {
    console.error('Job toggle active error:', error);
    return c.json({ error: 'Failed to toggle job status' }, 500);
  }
});

// POST /system-jobs/:id/run - Manually trigger job
app.post('/system-jobs/:id/run', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    
    // Update job to running status and increment run count
    const { data, error } = await supabase
      .from('system_jobs')
      .update({
        status: 'running',
        last_run_at: new Date().toISOString(),
        run_count: supabase.rpc('increment', { row_id: id, field: 'run_count' })
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error(`Error running job ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    // Note: In real scenario, this would trigger the actual job execution
    // For now, just update the status
    
    return c.json({ 
      data, 
      success: true,
      message: 'Job started successfully' 
    });
  } catch (error) {
    console.error('Job run error:', error);
    return c.json({ error: 'Failed to run job' }, 500);
  }
});

// DELETE /system-jobs/:id - Delete job
app.delete('/system-jobs/:id', async (c) => {
  try {
    const supabase = getSupabaseClient();
    const id = c.req.param('id');
    
    const { error } = await supabase
      .from('system_jobs')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`Error deleting system job ${id}:`, error);
      return c.json({ error: error.message }, error.code === 'PGRST116' ? 404 : 500);
    }
    
    return c.json({ 
      success: true,
      message: 'Job deleted successfully' 
    });
  } catch (error) {
    console.error('System job deletion error:', error);
    return c.json({ error: 'Failed to delete system job' }, 500);
  }
});

// GET /system-jobs/stats - Get statistics
app.get('/system-jobs/stats/overview', async (c) => {
  try {
    const supabase = getSupabaseClient();
    
    // Get all jobs
    const { data: jobs, error } = await supabase
      .from('system_jobs')
      .select('status, is_active, success_count, run_count');
    
    if (error) {
      console.error('Error fetching job stats:', error);
      return c.json({ error: error.message }, 500);
    }
    
    // Calculate statistics
    const stats = {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => j.is_active).length,
      runningJobs: jobs.filter(j => j.status === 'running').length,
      failedJobs: jobs.filter(j => j.status === 'failed').length,
      completedJobs: jobs.filter(j => j.status === 'completed').length,
      pausedJobs: jobs.filter(j => j.status === 'paused').length,
      successRate: jobs.reduce((acc, j) => acc + (j.run_count > 0 ? j.success_count / j.run_count : 0), 0) / (jobs.length || 1) * 100
    };
    
    return c.json({ data: stats, success: true });
  } catch (error) {
    console.error('Job stats error:', error);
    return c.json({ error: 'Failed to fetch job statistics' }, 500);
  }
});

export default app;