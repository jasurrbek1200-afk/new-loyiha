create table if not exists departments (
  id text primary key,
  name text not null,
  room text not null,
  floor int not null,
  doctor_name text not null,
  doctor_bio text not null default '',
  doctor_speciality text not null default '',
  work_start text not null default '08:00',
  work_end text not null default '17:00',
  lunch_start text not null default '12:00',
  lunch_end text not null default '13:00',
  rating numeric(2,1) not null default 0,
  reviews int not null default 0,
  per_patient_minutes int not null default 10,
  keywords text[] not null default '{}'
);

create table if not exists queue_entries (
  id serial primary key,
  department_id text not null references departments(id) on delete cascade,
  patient_name text not null default 'Bemor',
  patient_photo text,
  ticket_code text not null,
  status text not null default 'waiting' check (status in ('waiting','in_progress','done','cancelled')),
  created_at timestamptz not null default now(),
  called_at timestamptz,
  finished_at timestamptz
);

create index if not exists idx_queue_dept_status on queue_entries(department_id, status);
