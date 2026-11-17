# Taha Android Library PDF Importer

This workflow uploads **complete, authorized** PDFs to the separate Supabase project `Taha Android Library`, bucket `school-pdfs`.

1. Add a repository Actions secret named `SUPABASE_STORAGE_SECRET` using a project-specific Supabase **secret/service role** key. Never commit it or place it in the public website.
2. Populate `library-import/manifest.json` with real HTTPS PDF URLs. Set `approved_for_rehosting: true` only when the copyright holder permits copying/redistribution (e.g., applicable public license or explicit permission).
3. In GitHub Actions, run **Import approved school PDFs to Supabase** manually.
4. Download the `library-import-report` artifact and review upload status. Only after successful uploads, update the website's PDF catalog to use the resulting public URLs.

Example entry:
```json
{"grade":"2","type":"book","title":"Example textbook","slug":"grade2-example","url":"https://example.org/authorized.pdf","approved_for_rehosting":false}
```
The importer skips unapproved entries; validates PDF header, trailer, 50 MiB size, grade and type; avoids overwriting files; and reports failures. It does not bypass copyright, paywalls or anti-bot protections. Bucket public-read means PDFs are publicly accessible. Storage and bandwidth are subject to free-plan limits.

## Verified discovery sources (2026-11-17)

- Iraqi Ministry of Education curriculum portal: https://manahj.edu.iq/ (official textbook source; confirm each PDF and edition before cataloging).
- Official curriculum update for 2026–2027: https://manahj.edu.iq/index.php?name=Pages&op=page&pid=164 and https://manahj.edu.iq/index.php?name=Pages&op=page&pid=165.
- Notes / educational resources: https://iraqmlzm.com/ (link to original pages unless explicit redistribution permission exists).
- Past ministerial questions and model answers: https://www.aselatna.com/ and https://t.me/IraqEduExams (verify individual documents and whether solutions are official).
- Additional examination archives: https://qus.haltaelam.com/ and https://iraqiteacher.com/exams.

Do not mark these discovery pages as imported PDFs. For each item, verify exact grade, subject, year, file URL, accessibility and redistribution license; preserve source attribution. Do not set `approved_for_rehosting` to true without authorization. Existing importer uploads only approved entries.
