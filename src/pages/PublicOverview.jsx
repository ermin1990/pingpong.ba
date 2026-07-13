import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Trophy, LayoutGrid, List, Activity, Share2, Code, Zap } from 'lucide-react';

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-6">
    <div className="flex gap-4">
      <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-blue-400">
        <Icon size={20} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <div className="text-slate-400 mt-2">{children}</div>
      </div>
    </div>
  </div>
);

const PublicOverview = () => {
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-8">
          <h1 className="text-2xl font-black">Kako koristiti aplikaciju — Kratki priručnik</h1>
          <p className="text-slate-400 mt-2">Ovaj vodič pokazuje korak-po-korak kako organizovati takmičenja, upravljati igračima i voditi turnire koristeći Padel.ba.</p>
        </div>

        <Section title="1) Registracija i dobijanje pristupa" icon={Users}>
          <ol className="list-decimal list-inside space-y-2">
            <li>Registrujte nalog ili se prijavite (gornji desni ugao).</li>
            <li>Ako niste automatski verifikovani, pošaljite zahtjev putem forme na landing stranici (kliknite "Postani Organizator").</li>
            <li>Super Admin će odobriti pristup i dodijeliti ulogu organizatora.</li>
          </ol>
        </Section>

        <Section title="2) Kreiranje takmičenja" icon={Trophy}>
          <div className="space-y-2">
            <p>Poslije verifikacije možete kreirati novo takmičenje preko sekcije "Turniri".</p>
            <ul className="list-disc list-inside text-slate-400">
              <li>Odaberite format: <strong>Knockout</strong>, <strong>Groups</strong> (grupna faza + eliminacije) ili <strong>League</strong> (Berger).</li>
              <li>Unesite osnovne informacije: naziv, sport, datum, broj kategorija.</li>
              <li>Podesite vidljivost: javno (slug) ili privatno.</li>
            </ul>
          </div>
        </Section>

        <Section title="3) Kategorije i igrači" icon={LayoutGrid}>
          <div>
            <p>Za svako takmičenje kreirajte kategorije (npr. Muškarci A, Žene B) i dodajte igrače.</p>
            <ol className="list-decimal list-inside space-y-2 text-slate-400">
              <li>Možete ručno dodati igrače ili ih uvesti iz postojeće baze.</li>
              <li>Za grupne faze podesite broj grupa i ručne redoslijede ako želite overridati automatsko sortiranje.</li>
              <li>U svakom igraču možete dodati klub i ostale metapodatke.</li>
            </ol>
          </div>
        </Section>

        <Section title="4) Generisanje grupa i žrijeb" icon={Zap}>
          <div>
            <p>U kategoriji koristite opciju za generisanje grupa (Round-Robin) ili ručno dodajte igrače u grupe.</p>
            <ul className="list-disc list-inside text-slate-400">
              <li>Algoritam podržava Bergerov sistem za liga/round-robin.</li>
              <li>Možete izabrati balans grupa ili permutacije seed-ova.</li>
              <li>Ukoliko želite, podesite ručno "manual orders" za posebne raspozicije.</li>
            </ul>
          </div>
        </Section>

        <Section title="5) Raspored mečeva i unos rezultata" icon={List}>
          <div>
            <p>Raspored se kreira automatski iz grupe / žrijeba. Mečeve možete i ručno mijenjati.</p>
            <ol className="list-decimal list-inside space-y-2 text-slate-400">
              <li>Otvorite tab "Raspored" u kategoriji i pregledajte sve najavljene mečeve.</li>
              <li>Za unos rezultata kliknite na meč i upišite setove (po setu p1/p2) — sistem računa pobjednika automatski.</li>
              <li>Za live vođenje koristite javni prikaz ili posebne UI modale za brzo ažuriranje (za tablete/telefon u dvorani).</li>
            </ol>
          </div>
        </Section>

        <Section title="6) Eliminacije (Knockout)" icon={Activity}>
          <div>
            <p>Eliminacijski žrijeb se kreira iz rezultata grupne faze ili ručno.</p>
            <ul className="list-disc list-inside text-slate-400">
              <li>Polufinala, četvrtfinala i finale se prikazuju kroz bracket view.</li>
              <li>Mečevi koji su u toku dobijaju oznaku <strong>UŽIVO</strong>.</li>
              <li>Možete ručno izabrati tko ide u eliminacije (npr. top N iz svake grupe) ili koristiti automatsko pravilo.</li>
            </ul>
          </div>
        </Section>

        <Section title="7) Liga (Berger) — bodovanje i tabele" icon={LayoutGrid}>
          <div>
            <p>Liga mod (Berger) koristi podesive bodove za pobjedu/poraz (padel se igra na setove, pa meč nikad ne može završiti neriješeno).</p>
            <ul className="list-disc list-inside text-slate-400">
              <li>Podesite bodove u postavkama lige (npr. 2/0).</li>
              <li>Tablice se računaju po bodovima, zatim set-differencama, pa po poen-differenci.</li>
              <li>Možete ručno primjeniti "manual order" ako želite nadjačati sortiranje.</li>
            </ul>
          </div>
        </Section>

        <Section title="8) Public / Share / Embed" icon={Share2}>
          <div>
            <p>Svako takmičenje može imati javni <code>slug</code> (link) koji je dostupan bez prijave.</p>
            <ol className="list-decimal list-inside space-y-2 text-slate-400">
              <li>Postavite slug u postavkama takmičenja i podijelite link <code>/p/:slug</code>.</li>
              <li>Embed opcija generiše iframe kod koji možete ubaciti u web stranice klubova.</li>
              <li>Javni prikaz pokazuje: kategorije, mečeve, tabele i eliminacije sa oznakama uživo.</li>
            </ol>
          </div>
        </Section>

        <Section title="9) Administracija i postavke" icon={Code}>
          <div>
            <p>Postavke takmičenja omogućuju detaljno podešavanje pravila.</p>
            <ul className="list-disc list-inside text-slate-400">
              <li>Postavite broj setova, bodovanje, trajanje meča i dodatna pravila.</li>
              <li>Dodajte suradnike (collaborators) koji mogu uređivati takmičenje.</li>
              <li>Arhivirajte završena takmičenja za pregled historije.</li>
            </ul>
          </div>
        </Section>

        <Section title="10) Česta pitanja / Troubleshooting" icon={BookOpen}>
          <div>
            <h4 className="text-sm font-bold text-white">Šta ako ne vidim javni prikaz?</h4>
            <p className="text-slate-400">Provjerite da takmičenje ima <strong>isPublic</strong> ili podešen slug. Ako je privatno, vidljivost je ograničena.</p>

            <h4 className="text-sm font-bold text-white mt-3">Kako popraviti pogrešno sortiranje u grupi?</h4>
            <p className="text-slate-400">Koristite opciju <em>Manual Order</em> u postavkama kategorije za ručno predefinisanje poretka.</p>

            <h4 className="text-sm font-bold text-white mt-3">Gdje se nalaze podaci?</h4>
            <p className="text-slate-400">Svi podaci su pohranjeni u Firebase.</p>
          </div>
        </Section>

        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 text-slate-400">
          <h4 className="text-white font-bold mb-2">Želite da ovo bude dostupno direktno iz UI?</h4>
          <p className="mb-2">Mogu dodati:</p>
          <ul className="list-disc list-inside text-slate-400">
            <li>Pristupnu stranicu u meniju (već je linkovano na landing page i u footeru).</li>
            <li>Detaljan FAQ u markdownu i modal u admin panelu.</li>
            <li>Primer embed koda direktno u modal takmičenja (iframe + dimenzije).</li>
          </ul>
          <div className="mt-4 text-right">
            <Link to="/p/help" className="text-blue-400 font-bold">Povratak na vrh</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicOverview;
