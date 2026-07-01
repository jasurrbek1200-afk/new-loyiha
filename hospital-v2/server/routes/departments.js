import { Router } from 'express'
import Anthropic from '@anthropic-ai/sdk'
import { pool } from '../db/pool.js'

const router = Router()
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null

const deptSql = `
  select d.*, count(q.id) filter (where q.status='waiting') as queue_count
  from departments d
  left join queue_entries q on q.department_id = d.id
  group by d.id order by d.floor, d.room
`

function fmt(r) {
  const queue = Number(r.queue_count)
  return {
    id: r.id, name: r.name, room: r.room, floor: r.floor,
    doctorName: r.doctor_name, doctorBio: r.doctor_bio, doctorSpeciality: r.doctor_speciality,
    workStart: r.work_start, workEnd: r.work_end, lunchStart: r.lunch_start, lunchEnd: r.lunch_end,
    rating: Number(r.rating), reviews: r.reviews, perPatientMinutes: r.per_patient_minutes,
    queue, waitMinutes: queue * r.per_patient_minutes,
  }
}

router.get('/', async (req, res) => {
  const r = await pool.query(deptSql)
  res.json(r.rows.map(fmt))
})

router.post('/match-symptom', async (req, res) => {
  const { text } = req.body || {}
  if (!text?.trim()) return res.status(400).json({ error: 'text kerak' })
  const depts = (await pool.query(deptSql)).rows.map(fmt)

  if (anthropic) {
    try {
      const list = depts.map(d => `${d.id}: ${d.name} (${d.doctorSpeciality})`).join('\n')
      const msg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6', max_tokens: 300,
        system: `Sen "Navbat" shifoxona tizimining AI yordamchisisan. O'zbek tilida gapirasan va juda samimiy, mehribon muloqot qilasan. Bemor alomatlarini eshitib, quyidagi bo'limlardan eng mos birini tavsiya qilasan:\n${list}\n\nFaqat shu JSON formatida javob ber, hech qanday boshqa matn yozma:\n{"departmentId":"...","reason":"...","greeting":"..."}`,
        messages: [{ role: 'user', content: text }]
      })
      const parsed = JSON.parse(msg.content.find(b => b.type === 'text').text.trim())
      const match = depts.find(d => d.id === parsed.departmentId) || depts[0]
      return res.json({ match, reason: parsed.reason, greeting: parsed.greeting, source: 'ai' })
    } catch(e) { console.error('AI xato:', e.message) }
  }

  const val = text.toLowerCase()
  let best = null, bestScore = 0
  for (const d of depts) {
    const score = (d.id === 'keywords' ? [] : []).length
    if (score > bestScore) { bestScore = score; best = d }
  }
  res.json({ match: best || depts[0], reason: 'Alomatlaringizga mos bo\'lim topildi.', source: 'keywords' })
})

router.post('/ai-chat', async (req, res) => {
  const { message, history } = req.body || {}
  if (!message?.trim()) return res.status(400).json({ error: 'message kerak' })

  if (!anthropic) return res.json({ reply: 'AI yordamchi hozircha mavjud emas. Iltimos, qabulxonaga murojaat qiling.' })

  try {
    const depts = (await pool.query(deptSql)).rows.map(fmt)
    const deptInfo = depts.map(d => `${d.name}: ${d.room}-xona, ${d.floor}-qavat, navbat ${d.queue} kishi, kutish ~${d.waitMinutes} daqiqa, shifokor: ${d.doctorName}`).join('\n')

    const messages = [
      ...(history || []),
      { role: 'user', content: message }
    ]

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6', max_tokens: 500,
      system: `Sen "Navbat" shifoxona tizimining mehribon AI yordamchisissan. Faqat O'zbek tilida gapirasan. Bemorlarni tinglaysan, ularni to'g'ri bo'limga yo'naltirasang va ularni xotirjam qilasan. Hech qachon tashxis qo'ymassan, faqat yo'naltirasang.\n\nHozirgi bo'limlar holati:\n${deptInfo}\n\nXushmuomalalik, samimiylik va professional muloqot qil.`,
      messages
    })
    res.json({ reply: response.content.find(b => b.type === 'text').text })
  } catch(e) {
    res.json({ reply: 'Kechirasiz, hozir texnik muammo bor. Iltimos, qabulxonaga murojaat qiling.' })
  }
})

export default router
