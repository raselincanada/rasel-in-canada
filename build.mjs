import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'source');
const output = path.join(root, 'dist');

const escapeHtml = (value = '') => String(value).replace(/[&<>"]/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[character]));
const safeUrl = (value = '') => {
  const url = String(value).trim();
  return /^(https?:\/\/|\/)/i.test(url) ? escapeHtml(url) : '';
};
const markdown = (value = '') => String(value).trim().split(/\n\s*\n/).filter(Boolean).map(paragraph => {
  let text = escapeHtml(paragraph).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return `<p>${text.replace(/\n/g, '<br>')}</p>`;
}).join('');

async function readJson(file) { return JSON.parse(await fs.readFile(file, 'utf8')); }
async function readCollection(folder) {
  let files = [];
  try { files = (await fs.readdir(folder)).filter(file => file.endsWith('.json')).sort(); } catch { return []; }
  return Promise.all(files.map(async file => ({...(await readJson(path.join(folder, file))), _slug: path.basename(file, '.json')})));
}

await fs.rm(output, {recursive: true, force: true});
await fs.cp(source, output, {recursive: true});
await fs.rm(path.join(output, 'studio.html'), {force: true});
await fs.rm(path.join(output, 'assets', 'studio.js'), {force: true});
await fs.rm(path.join(output, 'netlify.toml'), {force: true});
await fs.rm(path.join(output, 'DEPLOY.md'), {force: true});
await fs.rm(path.join(output, 'README.md'), {force: true});

const settings = await readJson(path.join(root, 'content', 'settings.json'));
const stories = (await readCollection(path.join(root, 'content', 'stories'))).sort((a,b) => String(b.date).localeCompare(String(a.date)));
const guides = await readCollection(path.join(root, 'content', 'guides'));

const socialHtml = `<div class="socials"><a href="${safeUrl(settings.youtube)}" target="_blank" rel="noopener noreferrer">YouTube</a><a href="${safeUrl(settings.facebook)}" target="_blank" rel="noopener noreferrer">Facebook</a><a href="${safeUrl(settings.instagram)}" target="_blank" rel="noopener noreferrer">Instagram</a><a href="${safeUrl(settings.tiktok)}" target="_blank" rel="noopener noreferrer">TikTok</a></div>`;
const contactLinks = `<div class="contact-links" data-cms-contact-links><a href="mailto:${escapeHtml(settings.email)}">✉ ${escapeHtml(settings.email)}</a><a href="${safeUrl(settings.youtube)}" target="_blank" rel="noopener noreferrer">▶ YouTube</a><a href="${safeUrl(settings.facebook)}" target="_blank" rel="noopener noreferrer">f Facebook</a><a href="${safeUrl(settings.instagram)}" target="_blank" rel="noopener noreferrer">◎ Instagram</a><a href="${safeUrl(settings.tiktok)}" target="_blank" rel="noopener noreferrer">♪ TikTok</a></div>`;

const heroTitle = (() => {
  const words = String(settings.hero_title || 'TRAVEL WITHOUT LIMITS').trim().split(/\s+/);
  return `${escapeHtml(words[0] || 'TRAVEL')}<br><span>${escapeHtml(words[1] || 'WITHOUT')}</span><br>${escapeHtml(words.slice(2).join(' ') || 'LIMITS')}`;
})();

const storyCard = story => {
  const image = safeUrl(story.featured_image);
  const media = image ? `<div class="card-media photo" style="background-image:url('${image}')"><span class="tag">TRAVEL STORY</span></div>` : '<div class="card-media media-banff"><span class="tag">TRAVEL STORY</span></div>';
  return `<article class="card reveal">${media}<div class="card-body"><div class="card-kicker">${escapeHtml(story.province || '')}${story.place ? ' • ' + escapeHtml(story.place) : ''}</div><h3>${escapeHtml(story.title)}</h3><p>${escapeHtml(story.excerpt || '')}</p><a class="text-link" href="stories.html#${escapeHtml(story._slug)}">Read story →</a></div></article>`;
};
const guideCard = guide => `<article class="card reveal"><div class="card-body"><div class="card-kicker">CANADA GUIDE</div><h3>${escapeHtml(guide.icon || '🍁')} ${escapeHtml(guide.title)}</h3><p>${escapeHtml(guide.excerpt || '')}</p><a class="text-link" href="guides.html#${escapeHtml(guide._slug)}">Read guide →</a></div></article>`;
const featured = [...stories.filter(item => item.featured).map(storyCard), ...guides.filter(item => item.featured).map(guideCard)].slice(0, 3);
const featuredHtml = `<div class="grid-3">${featured.length ? featured.join('') : '<p>No featured content yet.</p>'}</div>`;

const storiesHtml = stories.length ? stories.map(story => {
  const photos = [story.featured_image, ...(Array.isArray(story.gallery) ? story.gallery : [])].filter(Boolean);
  const gallery = photos.length ? `<div class="story-photo-grid">${photos.map((photo,index) => `<figure class="photo-open" tabindex="0" data-full="${safeUrl(photo)}"><img src="${safeUrl(photo)}" alt="${escapeHtml(story.title)} photo ${index + 1}" loading="lazy"></figure>`).join('')}</div>` : '';
  const video = safeUrl(story.video) ? `<a class="btn btn-primary" href="${safeUrl(story.video)}" target="_blank" rel="noopener noreferrer">Watch the video ↗</a>` : '';
  return `<article class="story-album card" id="${escapeHtml(story._slug)}"><div class="story-album-head"><div><p class="eyebrow">${escapeHtml(story.province || '')}${story.place ? ' • ' + escapeHtml(story.place) : ''}</p><h2>${escapeHtml(story.title)}</h2></div>${story.date ? `<time>${escapeHtml(String(story.date).slice(0,10))}</time>` : ''}</div><div class="story-copy">${markdown(story.body || story.excerpt)}</div>${gallery}${video}</article>`;
}).join('') : '<div class="empty-stories"><span>📷</span><h2>Your first story will appear here.</h2><p>Sign in to the private editor and publish an album.</p><a class="btn btn-primary" href="admin/">Open editor</a></div>';

const guidesHtml = `<div class="guide-list">${guides.map(guide => `<article class="guide-item detail-trigger reveal" id="${escapeHtml(guide._slug)}" role="button" tabindex="0" data-detail-icon="${escapeHtml(guide.icon || '🍁')}" data-detail-title="${escapeHtml(guide.title)}" data-detail-text="${escapeHtml(guide.body || guide.excerpt)}"><span>${escapeHtml(guide.icon || '🍁')}</span><div><h3>${escapeHtml(guide.title)}</h3><p>${escapeHtml(guide.excerpt || '')}</p><small>Open guide window</small></div><span class="arrow">→</span></article>`).join('')}</div>`;

const htmlFiles = (await fs.readdir(output)).filter(file => file.endsWith('.html'));
for (const file of htmlFiles) {
  const target = path.join(output, file);
  let html = await fs.readFile(target, 'utf8');
  html = html.replace(/<div class="socials">[\s\S]*?<\/div>/g, socialHtml);
  html = html.replace(/<p class="eyebrow" data-cms="hero_eyebrow">[\s\S]*?<\/p>/, `<p class="eyebrow" data-cms="hero_eyebrow">${escapeHtml(settings.hero_eyebrow)}</p>`);
  html = html.replace(/<h1 data-cms="hero_title">[\s\S]*?<\/h1>/, `<h1 data-cms="hero_title">${heroTitle}</h1>`);
  html = html.replace(/<p class="lead" data-cms="hero_text">[\s\S]*?<\/p>/, `<p class="lead" data-cms="hero_text">${escapeHtml(settings.hero_text)}</p>`);
  html = html.replace(/<p data-cms="homepage_story">[\s\S]*?<\/p>/, `<p data-cms="homepage_story">${escapeHtml(settings.homepage_story)}</p>`);
  html = html.replace(/<div class="story reveal" data-cms="about_story">[\s\S]*?<\/div>/, `<div class="story reveal" data-cms="about_story">${markdown(settings.about_story)}</div>`);
  html = html.replace(/<p data-cms="contact_intro">[\s\S]*?<\/p>/, `<p data-cms="contact_intro">${escapeHtml(settings.contact_intro)}</p>`);
  html = html.replace(/<div class="contact-links" data-cms-contact-links>[\s\S]*?<\/div>/, contactLinks);
  html = html.replace(/<!-- CMS_FEATURED_START -->[\s\S]*?<!-- CMS_FEATURED_END -->/, `<!-- CMS_FEATURED_START -->${featuredHtml}<!-- CMS_FEATURED_END -->`);
  html = html.replace(/<!-- CMS_GUIDES_START -->[\s\S]*?<!-- CMS_GUIDES_END -->/, `<!-- CMS_GUIDES_START -->${guidesHtml}<!-- CMS_GUIDES_END -->`);
  html = html.replace('<!-- CMS_FEATURED_START -->', '<!-- CMS_FEATURED_START -->');
  html = html.replace('<!-- CMS_FEATURED_END -->', '<!-- CMS_FEATURED_END -->');
  html = html.replace('<!-- CMS_GUIDES_START -->', '<!-- CMS_GUIDES_START -->');
  html = html.replace('<!-- CMS_GUIDES_END -->', '<!-- CMS_GUIDES_END -->');
  html = html.replace('<!-- CMS_FEATURED -->', featuredHtml);
  html = html.replace('<!-- CMS_GUIDES -->', guidesHtml);
  html = html.replace(/<!-- CMS_STORIES_START -->[\s\S]*?<!-- CMS_STORIES_END -->/, `<!-- CMS_STORIES_START --><div class="story-albums">${storiesHtml}</div><!-- CMS_STORIES_END -->`);
  html = html.replace('<!-- CMS_STORIES -->', `<div class="story-albums">${storiesHtml}</div>`);
  html = html.replace(/Rasel in Canada/g, escapeHtml(settings.site_name || 'Rasel in Canada'));
  await fs.writeFile(target, html);
}

console.log(`Built ${htmlFiles.length} pages, ${stories.length} stories, and ${guides.length} guides.`);
