-- Contoh isi katalog EA. Sesuaikan kode dan nama dengan EA yang benar-benar dijual.
insert into public.eas (code, name) values
  ('averaging-v1', 'EA Averaging'),
  ('trend-following-v1', 'EA Trend Following')
on conflict (code) do nothing;
