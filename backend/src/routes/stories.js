router.post('/upload', upload.single('storyMedia'), async (req, res) => {
  const { user_id } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  const mediaUrl = `/uploads/stories/${file.filename}`;
  const mediaType = file.mimetype.startsWith('video') ? 'video' : 'image';

  const result = await pool.query(
    `INSERT INTO stories (user_id, media_url, media_type)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [user_id, mediaUrl, mediaType]
  );

  res.json(result.rows[0]);
});

router.get('/', async (req, res) => {
  const result = await pool.query(`
    SELECT s.*, u.display_name, u.profile_image_url
    FROM stories s
    JOIN users u ON u.id = s.user_id
    WHERE s.created_at > NOW() - INTERVAL '24 HOURS'
    ORDER BY s.created_at DESC
  `);

  res.json(result.rows);
});