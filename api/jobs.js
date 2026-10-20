// Live job listings from MyCareersFuture (Singapore government job portal, public API, no key).
// Proxied here because the API does not allow browser calls from other origins. Cached for 30 minutes.
const MCF = 'https://api.mycareersfuture.gov.sg/v2/jobs';
const strip = (html = '') => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

export default async function handler(req, res) {
  const q = String(req.query.q || 'trust and safety').slice(0, 80);
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 12));
  // Exact job titles often return nothing, so widen step by step: "Trust & Safety Data Scientist" -> "trust and safety data" -> "trust and safety".
  const words = q.replace(/&/g, ' and ').replace(/[^\w\s-]/g, ' ').trim().toLowerCase().split(/\s+/);
  const tries = [q, ...Array.from({ length: Math.max(0, words.length - 1) }, (_, i) => words.slice(0, words.length - i).join(' '))].filter((x, i, a) => x && a.indexOf(x) === i && x.split(' ').length >= 2 && !/ (and|of|the|for)$/.test(x) || i === 0);
  try {
    // Collect from the narrowest search first, widening until there are enough listings to be useful.
    const seen = new Map(); let used = q, total = 0;
    for (const t of tries) {
      const r = await fetch(`${MCF}?search=${encodeURIComponent(t)}&limit=${limit}&page=0`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(9000) });
      if (!r.ok) throw new Error(`MyCareersFuture answered ${r.status}`);
      const page = await r.json(); used = t; total = Math.max(total, page.total || 0);
      for (const j of page.results || []) if (!seen.has(j.uuid)) seen.set(j.uuid, j);
      if (seen.size >= Math.min(limit, 6)) break;
    }
    const d = { results: [...seen.values()].slice(0, limit), total };
    const jobs = (d.results || []).map((j) => ({
      id: 'mcf-' + j.uuid,
      title: j.title,
      employer: j.postedCompany?.name || j.hiringCompany?.name || 'Employer not named',
      location: j.address?.isOverseas ? 'Overseas' : 'Singapore',
      mode: (j.employmentTypes || []).map((e) => e.employmentType).join(', ') || '',
      levels: (j.positionLevels || []).map((p) => p.position),
      minYears: j.minimumYearsExperience ?? null,
      salary: j.salary ? { min: j.salary.minimum, max: j.salary.maximum, type: j.salary.type?.salaryType || 'Monthly' } : null,
      skills: (j.skills || []).map((s) => s.skill).slice(0, 30),
      summary: strip(j.description).slice(0, 700),
      posted: j.metadata?.newPostingDate || j.metadata?.originalPostingDate || null,
      expires: j.metadata?.expiryDate || null,
      url: j.metadata?.jobDetailsUrl || null,
      source: 'MyCareersFuture',
    }));
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    res.status(200).json({ q: used, asked: q, total: d.total ?? jobs.length, fetchedAt: new Date().toISOString(), jobs });
  } catch (e) {
    res.status(502).json({ error: 'Could not reach MyCareersFuture right now.', detail: String(e.message || e) });
  }
}
