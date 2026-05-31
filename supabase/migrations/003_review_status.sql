-- Migration: Add 'review' status to task_status enum
-- Run this in Supabase Dashboard → SQL Editor

ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'review' AFTER 'doing';
