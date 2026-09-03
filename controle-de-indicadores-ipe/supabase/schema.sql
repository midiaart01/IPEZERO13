-- Table definition for Supabase
-- Execute this SQL query in your Supabase SQL Editor:

CREATE TABLE IF NOT EXISTS public.records (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  shift TEXT NOT NULL,
  "createdAt" TEXT NOT NULL,

  -- Brassagem
  sala1_ipe NUMERIC,
  sala2_ipe NUMERIC,
  extrato_agua_s1 NUMERIC,
  extrato_agua_s2 NUMERIC,

  -- Adega
  ctf1_perda_pct NUMERIC,
  ctf3_perda_pct NUMERIC,
  ctf1_perda_hl NUMERIC,
  ctf3_perda_hl NUMERIC,
  ctf1_deslodamentos NUMERIC,
  ctf3_deslodamentos NUMERIC,

  -- Adega Plus
  centrifuga_brux_hl NUMERIC,

  -- Filtração
  f01_perda_pct NUMERIC,
  f02_perda_pct NUMERIC,
  f1_perda_hl NUMERIC,
  f2_perda_hl NUMERIC,
  f1_extratinho NUMERIC,
  f2_extratinho NUMERIC,

  -- Problem Solving
  pi_brassagem INT DEFAULT 0,
  pi_adega INT DEFAULT 0,
  pi_filtracao INT DEFAULT 0,

  -- Totais Calculados
  "ivsScore" INT DEFAULT 0,
  "piScore" INT DEFAULT 0,
  "totalScore" INT DEFAULT 0,
  notes TEXT,

  CONSTRAINT unique_date_shift UNIQUE (date, shift)
);

-- Row Level Security (RLS)
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public select" ON public.records FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON public.records FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON public.records FOR DELETE USING (true);
