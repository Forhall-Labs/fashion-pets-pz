#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/bb01b61eaa8841a47d78bbb2caacdca3d5c8b01875c37cdb92023231a77b4199/contract';
import endContract from '../../snapshots/bb01b61eaa8841a47d78bbb2caacdca3d5c8b01875c37cdb92023231a77b4199/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'appointments',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('date', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
          col('duration_minutes', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('flagged_reason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('pet_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('service_type', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('source', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('start_time', 'time', { notNull: true, codecRef: { codecId: 'pg/time-string@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('scheduled'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'appointments_service_type_check_53dd9159',
            "\"service_type\" IN ('full_groom', 'quick_service')",
          ),
          checkExpression(
            'appointments_source_check_f0dbab61',
            "\"source\" IN ('manual', 'auto_scheduled', 'waiting_list_approval')",
          ),
          checkExpression(
            'appointments_status_check_98d653cd',
            "\"status\" IN ('scheduled', 'completed', 'cancelled')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'blackout_periods',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('end_date', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('label', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('start_date', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('blackout_periods_end_after_start_a710e474', 'end_date >= start_date'),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'owners',
        columns: [
          col('address', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('address_lat', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('address_lng', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('fixed_visit_day', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('phone', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'owners_fixed_visit_day_check_cedf55ba',
            "\"fixed_visit_day\" IN ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'pets',
        columns: [
          col('avg_service_duration_minutes', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('breed', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('grooming_frequency', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('is_aggressive', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('location_address', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('location_lat', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('location_lng', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('needs_pickup', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('owner_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('size', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'pets_grooming_frequency_check_268ed8d2',
            "\"grooming_frequency\" IN ('twice_a_month', 'once_a_month', 'once_every_two_months')",
          ),
          checkExpression(
            'pets_size_check_b0c72280',
            "\"size\" IN ('small', 'medium', 'extra_large')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'shop_config',
        columns: [
          col('close_time', 'time', { notNull: true, codecRef: { codecId: 'pg/time-string@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('max_pets_per_day', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('open_time', 'time', { notNull: true, codecRef: { codecId: 'pg/time-string@1' } }),
          col('quick_service_duration_minutes', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('shop_config_close_after_open_23e29035', 'close_time > open_time'),
          checkExpression('shop_config_max_pets_per_day_positive_a010f6bd', 'max_pets_per_day > 0'),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'waiting_list_entries',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('fulfilled_appointment_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('pet_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('preferred_end_date', 'date', { codecRef: { codecId: 'pg/date-string@1' } }),
          col('preferred_start_date', 'date', { codecRef: { codecId: 'pg/date-string@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('active'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'waiting_list_entries_status_check_498857ef',
            "\"status\" IN ('active', 'fulfilled', 'cancelled')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'waiting_list_entries',
        constraint: 'waiting_list_entries_fulfilled_appointment_id_key',
        columns: ['fulfilled_appointment_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'appointments',
        index: 'appointments_date_idx_b4ca319c',
        columns: ['date'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'appointments',
        index: 'appointments_pet_id_idx_c47af682',
        columns: ['pet_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'blackout_periods',
        index: 'blackout_periods_start_date_end_date_idx_7bb2ae1b',
        columns: ['start_date', 'end_date'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pets',
        index: 'pets_owner_id_idx_ade9f347',
        columns: ['owner_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'waiting_list_entries',
        index: 'waiting_list_entries_pet_id_idx_c47af682',
        columns: ['pet_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'waiting_list_entries',
        index: 'waiting_list_entries_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'appointments',
        foreignKey: {
          name: 'appointments_pet_id_fkey',
          columns: ['pet_id'],
          references: { schema: 'public', table: 'pets', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'pets',
        foreignKey: {
          name: 'pets_owner_id_fkey',
          columns: ['owner_id'],
          references: { schema: 'public', table: 'owners', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'waiting_list_entries',
        foreignKey: {
          name: 'waiting_list_entries_pet_id_fkey',
          columns: ['pet_id'],
          references: { schema: 'public', table: 'pets', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'waiting_list_entries',
        foreignKey: {
          name: 'waiting_list_entries_fulfilled_appointment_id_fkey',
          columns: ['fulfilled_appointment_id'],
          references: { schema: 'public', table: 'appointments', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'appointments' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'blackout_periods' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'owners' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'pets' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'shop_config' }),
      this.enableRowLevelSecurity({ schema: 'public', table: 'waiting_list_entries' }),
      this.createRlsPolicy({
        schema: 'public',
        table: 'appointments',
        policy: {
          naming: { kind: 'wire', prefix: 'appointments_admin_only', hash: '935c2c52' },
          tableName: 'appointments',
          namespaceId: 'public',
          operation: 'all',
          roles: ['authenticated'],
          using: 'true',
          withCheck: 'true',
          permissive: true,
        },
      }),
      this.createRlsPolicy({
        schema: 'public',
        table: 'blackout_periods',
        policy: {
          naming: { kind: 'wire', prefix: 'blackout_periods_admin_only', hash: '935c2c52' },
          tableName: 'blackout_periods',
          namespaceId: 'public',
          operation: 'all',
          roles: ['authenticated'],
          using: 'true',
          withCheck: 'true',
          permissive: true,
        },
      }),
      this.createRlsPolicy({
        schema: 'public',
        table: 'owners',
        policy: {
          naming: { kind: 'wire', prefix: 'owners_admin_only', hash: '935c2c52' },
          tableName: 'owners',
          namespaceId: 'public',
          operation: 'all',
          roles: ['authenticated'],
          using: 'true',
          withCheck: 'true',
          permissive: true,
        },
      }),
      this.createRlsPolicy({
        schema: 'public',
        table: 'pets',
        policy: {
          naming: { kind: 'wire', prefix: 'pets_admin_only', hash: '935c2c52' },
          tableName: 'pets',
          namespaceId: 'public',
          operation: 'all',
          roles: ['authenticated'],
          using: 'true',
          withCheck: 'true',
          permissive: true,
        },
      }),
      this.createRlsPolicy({
        schema: 'public',
        table: 'shop_config',
        policy: {
          naming: { kind: 'wire', prefix: 'shop_config_admin_only', hash: '935c2c52' },
          tableName: 'shop_config',
          namespaceId: 'public',
          operation: 'all',
          roles: ['authenticated'],
          using: 'true',
          withCheck: 'true',
          permissive: true,
        },
      }),
      this.createRlsPolicy({
        schema: 'public',
        table: 'waiting_list_entries',
        policy: {
          naming: { kind: 'wire', prefix: 'waiting_list_entries_admin_only', hash: '935c2c52' },
          tableName: 'waiting_list_entries',
          namespaceId: 'public',
          operation: 'all',
          roles: ['authenticated'],
          using: 'true',
          withCheck: 'true',
          permissive: true,
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
