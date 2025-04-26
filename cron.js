require('dotenv').config()

const runCronJob = async () => {
  console.log('running cron job', new Date().toISOString())
  const res = await fetch(`${process.env.BASE_URL}/api/cron`, { headers: { 'Authorization': `Bearer ${process.env.CRON_SECRET}` } })
    .then(res => res.json())
  console.log('cron job done', res)
}

runCronJob() // 0 4 1 * * -> at 4am on the 1st of every month
