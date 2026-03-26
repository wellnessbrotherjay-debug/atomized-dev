-- Add industry and website columns to clients table
alter table public.clients add column industry text;
alter table public.clients add column website text;
