import { Router } from 'express'
import { pool } from '../db/pool.js'

const router = Router()

router.get('/:departmentId', async (req, res) => {
  const r = await pool.query(
    `select * from queue_entries where department_id=$1 and status in ('waiting','in_progress') order by created_at`,
    [req.params.departmentId]
  )
  res.json(r.rows)
})

router.post('/book', async (req, res) => {
  const { departmentId, patientName, patientPhoto } = req.body || {}
  if (!departmentId) return res.status(400).json({ error: 'departmentId kerak' })
  const dept = await pool.query('select id from departments where id=$1', [departmentId])
  if (!dept.rowCount) return res.status(404).json({ error: "Bo'lim topilmadi" })
  const countRes = await pool.query(`select count(*) from queue_entries where department_id=$1 and status='waiting'`, [departmentId])
  const num = Number(countRes.rows[0].count) + 1
  const ticket = departmentId.slice(0,2).toUpperCase() + String(num + 100).padStart(3,'0')
  const r = await pool.query(
    `insert into queue_entries (department_id, patient_name, patient_photo, ticket_code) values ($1,$2,$3,$4) returning *`,
    [departmentId, patientName || 'Bemor', patientPhoto || null, ticket]
  )
  res.status(201).json(r.rows[0])
})

router.post('/:departmentId/advance', async (req, res) => {
  const next = await pool.query(
    `select id from queue_entries where department_id=$1 and status='waiting' order by created_at limit 1`,
    [req.params.departmentId]
  )
  if (!next.rowCount) return res.status(404).json({ error: 'Navbatda bemor yo\'q' })
  const r = await pool.query(
    `update queue_entries set status='in_progress', called_at=now() where id=$1 returning *`,
    [next.rows[0].id]
  )
  res.json(r.rows[0])
})

router.post('/:entryId/finish', async (req, res) => {
  const r = await pool.query(
    `update queue_entries set status='done', finished_at=now() where id=$1 returning *`,
    [req.params.entryId]
  )
  if (!r.rowCount) return res.status(404).json({ error: 'Topilmadi' })
  res.json(r.rows[0])
})

export default router
