-- ============================================================
-- Migration 0011: plan van aanpak als tekst
--
-- Het plan van aanpak is informatie voor de klant: per stap een titel en
-- een korte uitleg, puur ter inzage. Per dienst een standaardtekst, en per
-- project aan te passen. Geen huidige stap, geen koppeling met de voortgang.
--
-- Formaat (zelfde voor dienst en project): één stap per regel,
--   Titel — uitleg
-- ============================================================

alter table public.service_links add column if not exists plan_text text;
alter table public.projects      add column if not exists plan_text text;

-- ---------- restanten van de eerste opzet opruimen ----------
-- Die had stappen als rijen plus een "huidige stap" per project. Stappen die
-- in het beheerscherm zijn aangepast nemen we over; zijn ze nog gelijk aan de
-- oude beginset, dan krijgt de dienst de nieuwe standaardtekst hieronder.
do $$
begin
  if to_regclass('public.service_milestones') is not null then
    update public.service_links s
       set plan_text = eigen.tekst
      from (
        select project_type, string_agg(title, E'\n' order by position) as tekst
        from public.service_milestones
        group by project_type
      ) eigen
     where eigen.project_type = s.project_type
       and s.plan_text is null
       and eigen.tekst <> case s.project_type
         when 'glascoating'   then E'Intake & inspectie\nWassen & decontamineren\nLakcorrectie\nCoating aanbrengen\nUitharden\nEindcontrole & oplevering'
         when 'ppf'           then E'Intake & inspectie\nWassen & decontamineren\nPanelen voorbereiden\nPPF aanbrengen\nUitharden & nalopen\nEindcontrole & oplevering'
         when 'detailing'     then E'Intake & inspectie\nInterieur\nWassen & decontamineren\nPolijsten\nBescherming\nEindcontrole & oplevering'
         when 'wrap'          then E'Intake & inspectie\nReinigen & demonteren\nWrap aanbrengen\nMonteren & nalopen\nEindcontrole & oplevering'
         when 'schadeherstel' then E'Schadeopname\nUitdeuken & herstel\nSpuitwerk\nPolijsten & afwerken\nEindcontrole & oplevering'
         when 'upgrade'       then E'Intake\nMontage\nTesten\nOplevering'
         when 'overig'        then E'Intake\nUitvoering\nEindcontrole & oplevering'
         else ''
       end;
  end if;
end $$;

drop table if exists public.service_milestones;
alter table public.projects drop column if exists current_step;

-- ---------- standaardtekst per dienst ----------
-- Alleen waar nog niets staat, zodat opnieuw draaien niets overschrijft.
update public.service_links set plan_text = $plan$Intake & inspectie — We bekijken je auto samen onder goed licht en leggen krassen, steenslag en de staat van de lak vast. Zo weet je vooraf wat we wel en niet kunnen verbeteren.
Wassen & decontamineren — Een grondige handwas, gevolgd door het verwijderen van vliegroest, teer en ander vuil dat met wassen alleen niet loskomt.
Lakcorrectie — We polijsten de lak om swirls en lichte krassen weg te werken. Dit bepaalt hoe de coating straks glanst, dus hier nemen we de tijd voor.
Coating aanbrengen — Paneel voor paneel brengen we de glascoating aan in een stofvrije ruimte, en we lopen elke laag na.
Uitharden — De coating hardt uit onder gecontroleerde omstandigheden. In deze periode blijft je auto binnen.
Eindcontrole & oplevering — We controleren alles nog één keer en lopen bij het ophalen met je door hoe je de coating het beste onderhoudt.$plan$
where project_type = 'glascoating' and plan_text is null;

update public.service_links set plan_text = $plan$Intake & inspectie — We bespreken welke panelen we beschermen en leggen de staat van de lak vast, inclusief steenslag en krassen.
Wassen & decontamineren — Een grondige reiniging, zodat er geen vuil onder de folie terechtkomt.
Panelen voorbereiden — Waar nodig polijsten we de lak eerst, en we demonteren onderdelen zoals emblemen zodat de folie strak om de randen valt.
PPF aanbrengen — De folie wordt op maat gesneden en paneel voor paneel aangebracht, met omgeslagen randen waar dat kan.
Uitharden & nalopen — De folie hecht zich in de dagen erna volledig. We lopen alle randen en eventuele luchtbelletjes na.
Eindcontrole & oplevering — Een laatste controle onder goed licht, en bij het ophalen leggen we uit hoe je de folie verzorgt.$plan$
where project_type = 'ppf' and plan_text is null;

update public.service_links set plan_text = $plan$Intake & inspectie — We lopen samen om je auto heen en spreken af waar de aandacht naartoe gaat.
Interieur — Stofzuigen, bekleding en leer reinigen, en alle oppervlakken en ramen aan de binnenkant schoonmaken.
Wassen & decontamineren — Een veilige handwas en het verwijderen van vliegroest, teer en ingebakken vuil.
Polijsten — Afhankelijk van het pakket brengen we de glans terug en werken we swirls en lichte krassen weg.
Bescherming — Een beschermlaag op lak, ramen en kunststof, zodat je auto langer schoon blijft.
Eindcontrole & oplevering — We lopen alles na voordat je je auto ophaalt.$plan$
where project_type = 'detailing' and plan_text is null;

update public.service_links set plan_text = $plan$Intake & inspectie — We bespreken kleur en afwerking en controleren of de lak geschikt is om te wrappen.
Reinigen & demonteren — Grondig reinigen, en onderdelen zoals deurgrepen, emblemen en lampen demonteren voor een strak resultaat.
Wrap aanbrengen — De folie wordt paneel voor paneel aangebracht en rond randen en naden verwerkt.
Monteren & nalopen — Alle onderdelen gaan terug en we lopen randen en naden na.
Eindcontrole & oplevering — Een laatste controle, en uitleg over het onderhoud van je wrap.$plan$
where project_type = 'wrap' and plan_text is null;

update public.service_links set plan_text = $plan$Schadeopname — We bekijken de schade, maken foto's en bespreken de aanpak en hoe lang het duurt.
Uitdeuken & herstel — Deuken drukken we waar mogelijk terug zonder spuitwerk; anders herstellen we eerst de ondergrond.
Spuitwerk — Waar nodig spuiten we het onderdeel in de juiste kleur en werken we het weg in de omliggende lak.
Polijsten & afwerken — De herstelde plek wordt gepolijst tot hij niet meer te onderscheiden is van de rest.
Eindcontrole & oplevering — We controleren het herstel onder verschillend licht voordat je je auto ophaalt.$plan$
where project_type = 'schadeherstel' and plan_text is null;

update public.service_links set plan_text = $plan$Intake — We bespreken wat er wordt ingebouwd en waar.
Montage — De upgrade wordt netjes ingebouwd, met de kabels uit het zicht weggewerkt.
Testen — We testen alles uitgebreid voordat je je auto terugkrijgt.
Oplevering — Bij het ophalen leggen we uit hoe alles werkt.$plan$
where project_type = 'upgrade' and plan_text is null;

update public.service_links set plan_text = $plan$Intake — We bespreken samen wat er moet gebeuren.
Uitvoering — We voeren de afgesproken werkzaamheden uit.
Eindcontrole & oplevering — We lopen alles na voordat je je auto ophaalt.$plan$
where project_type = 'overig' and plan_text is null;
