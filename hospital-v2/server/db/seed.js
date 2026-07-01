import { pool } from './pool.js'

const departments = [
  { id:'terapevt', name:'Terapevt', room:'101', floor:1, doctor_name:'Dr. Nilufar Karimova', doctor_bio:'15 yillik tajribaga ega, umumiy kasalliklar bo\'yicha mutaxassis. Respublika shifoxonasida oliy toifali shifokor.', doctor_speciality:'Umumiy terapiya', work_start:'08:00', work_end:'17:00', lunch_start:'12:00', lunch_end:'13:00', rating:4.8, reviews:312, per_patient_minutes:6, keywords:['isitma','holsizlik','sovuq','gripp','umumiy','shamollash','charchoq','ishtaha'] },
  { id:'lor', name:'LOR', room:'102', floor:1, doctor_name:'Dr. Madina Rashidova', doctor_bio:'Quloq-burun-tomoq kasalliklari bo\'yicha 12 yillik tajriba. Xalqaro sertifikatlangan mutaxassis.', doctor_speciality:'Otorinolaringologiya', work_start:'09:00', work_end:'17:00', lunch_start:'13:00', lunch_end:'14:00', rating:4.6, reviews:198, per_patient_minutes:8, keywords:['tomoq','quloq','burun','yotal','gaymorit','nafas','tiqilib'] },
  { id:'oftalmolog', name:'Oftalmolog', room:'103', floor:1, doctor_name:'Dr. Jasur Nazarov', doctor_bio:'Ko\'z kasalliklari va mikrojarrohlik bo\'yicha mutaxassis. 10 yillik amaliy tajriba.', doctor_speciality:'Oftalmologiya', work_start:'08:00', work_end:'16:00', lunch_start:'12:00', lunch_end:'13:00', rating:4.7, reviews:156, per_patient_minutes:9, keywords:["ko'z","ko'rish",'ko\'z og\'riq','ko\'z qizarish'] },
  { id:'jarroh', name:'Jarroh', room:'104', floor:1, doctor_name:'Dr. Bobur Toshmatov', doctor_bio:'Umumiy jarrohlik bo\'yicha professor darajasidagi mutaxassis. 20 yillik tajriba.', doctor_speciality:'Umumiy jarrohlik', work_start:'07:00', work_end:'15:00', lunch_start:'11:00', lunch_end:'12:00', rating:4.9, reviews:89, per_patient_minutes:20, keywords:['jarrohlik','operatsiya','yarа','apenditsit','grija'] },
  { id:'kardiolog', name:'Kardiolog', room:'201', floor:2, doctor_name:'Dr. Dilnoza Azimova', doctor_bio:'Yurak-qon tomir kasalliklari bo\'yicha doktorlik dissertatsiyasi himoyalagan. 18 yillik tajriba.', doctor_speciality:'Kardiologiya', work_start:'09:00', work_end:'17:00', lunch_start:'13:00', lunch_end:'14:00', rating:4.9, reviews:267, per_patient_minutes:12, keywords:["yurak","ko'krak",'bosim','qon bosimi','puls','aritmiya','taxikardiya'] },
  { id:'nevrolog', name:'Nevrolog', room:'202', floor:2, doctor_name:'Dr. Ulugbek Yusupov', doctor_bio:'Nevrologiya va bosh miya kasalliklari bo\'yicha xalqaro darajada tan olingan mutaxassis.', doctor_speciality:'Nevrologiya', work_start:'08:00', work_end:'16:00', lunch_start:'12:00', lunch_end:'13:00', rating:4.8, reviews:201, per_patient_minutes:10, keywords:['bosh','migren','uyqu','bosh aylanishi','asab','falaj','titroq'] },
  { id:'ortoped', name:'Ortoped', room:'203', floor:2, doctor_name:'Dr. Sarvar Xolmatov', doctor_bio:'Suyak va bo\'g\'im kasalliklari bo\'yicha mutaxassis. Artroplastika jarrohligida tajribali.', doctor_speciality:'Ortopediya', work_start:'08:00', work_end:'16:00', lunch_start:'12:00', lunch_end:'13:00', rating:4.7, reviews:143, per_patient_minutes:12, keywords:["suyak","bo'g'im",'umurtqa','tizza','belkurak','oyoq og\'riq','qo\'l og\'riq'] },
  { id:'stomatolog', name:'Stomatolog', room:'301', floor:3, doctor_name:'Dr. Sardor Tolipov', doctor_bio:'Stomatologiya va estetik tish davolash bo\'yicha mutaxassis. Zamonaviy usullar bilan ishlaydi.', doctor_speciality:'Stomatologiya', work_start:'09:00', work_end:'18:00', lunch_start:'13:00', lunch_end:'14:00', rating:4.9, reviews:445, per_patient_minutes:15, keywords:["tish","og'iz",'milk','tish og\'riq','tish parvarishi'] },
  { id:'endokrinolog', name:'Endokrinolog', room:'302', floor:3, doctor_name:'Dr. Zulfiya Mirzayeva', doctor_bio:'Diabet va gormon kasalliklari bo\'yicha mutaxassis. 14 yillik klinik tajriba.', doctor_speciality:'Endokrinologiya', work_start:'09:00', work_end:'17:00', lunch_start:'13:00', lunch_end:'14:00', rating:4.6, reviews:178, per_patient_minutes:15, keywords:['diabet','gormon','qalqonsimon bez','semizlik','charchoq','tashnalik'] },
  { id:'dermatolog', name:'Dermatolog', room:'303', floor:3, doctor_name:'Dr. Kamola Ergasheva', doctor_bio:'Teri kasalliklari va kosmetologiya bo\'yicha mutaxassis. Allergiya davolashda tajribali.', doctor_speciality:'Dermatologiya', work_start:'10:00', work_end:'18:00', lunch_start:'14:00', lunch_end:'15:00', rating:4.7, reviews:234, per_patient_minutes:10, keywords:['teri','toshma','allergiya','qichima','ekzema','akne','psoriaz'] },
]

const queueCounts = { terapevt:8, lor:5, oftalmolog:3, jarroh:2, kardiolog:7, nevrolog:4, ortoped:3, stomatolog:6, endokrinolog:2, dermatolog:5 }

function genTicket(deptId, i) {
  return deptId.slice(0,2).toUpperCase() + String(i+101).padStart(3,'0')
}

async function seed() {
  const client = await pool.connect()
  try {
    await client.query('begin')
    await client.query('delete from queue_entries')
    await client.query('delete from departments')
    for (const d of departments) {
      await client.query(
        `insert into departments (id,name,room,floor,doctor_name,doctor_bio,doctor_speciality,work_start,work_end,lunch_start,lunch_end,rating,reviews,per_patient_minutes,keywords)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
        [d.id,d.name,d.room,d.floor,d.doctor_name,d.doctor_bio,d.doctor_speciality,d.work_start,d.work_end,d.lunch_start,d.lunch_end,d.rating,d.reviews,d.per_patient_minutes,d.keywords]
      )
      const count = queueCounts[d.id] || 0
      for (let i = 0; i < count; i++) {
        await client.query(
          `insert into queue_entries (department_id, patient_name, ticket_code) values ($1,$2,$3)`,
          [d.id, `Bemor ${i+1}`, genTicket(d.id, i)]
        )
      }
    }
    await client.query('commit')
    console.log("Ma'lumotlar yuklandi.")
  } catch(e) { await client.query('rollback'); throw e }
  finally { client.release(); await pool.end() }
}
seed().catch(e => { console.error(e); process.exit(1) })
