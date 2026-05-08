import React, { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

import { useCompetitionData } from '../components/public/PublicCompetition/useCompetitionData';
import CompetitionHeader from '../components/public/PublicCompetition/sections/CompetitionHeader';
import Navigation from '../components/public/PublicCompetition/sections/Navigation';
import CompetitionBody from '../components/public/PublicCompetition/sections/CompetitionBody';
import GlobalUIElements from '../components/public/PublicCompetition/UI/GlobalUIElements';

const PublicCompetitionNew = () => {
  const { slug, categorySlug } = useParams();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const isEmbed = searchParams.get('embed') === 'true';

  const {
    competition,
    loading,
    error,
    categories,
    activeCategory,
    allMatches,
    allPlayers
  } = useCompetitionData();

  const [activeTab, setActiveTab] = useState('groups');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAtTop, setShowAtTop] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    const handleScroll = () => setShowAtTop(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (activeCategory?.format === 'knockout' && activeTab === 'groups') {
      setActiveTab('knockout');
    }
  }, [activeCategory]);

  const onShare = () => {
    if (navigator.share) {
      navigator.share({ title: competition?.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link kopiran!');
    }
  };

  const normalizeExternalUrl = (value) => {
    const raw = (value || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    return `https://${raw}`;
  };

  const publicSocialLinks = useMemo(() => {
    const list = Array.isArray(competition?.publicProfile?.socialLinks)
      ? competition.publicProfile.socialLinks
      : [];

    return list
      .map((item) => ({
        label: item?.label || 'Link',
        url: normalizeExternalUrl(item?.url),
      }))
      .filter((item) => item.url);
  }, [competition]);

  const publicVideoBanners = useMemo(() => {
    const list = Array.isArray(competition?.publicProfile?.videoBanners)
      ? competition.publicProfile.videoBanners
      : [];

    return list
      .map((item) => ({
        title: item?.title || 'Live prenos',
        url: normalizeExternalUrl(item?.url),
      }))
      .filter((item) => item.url);
  }, [competition]);

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
      <div className="w-20 h-20 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
      <p className="text-blue-500 font-black uppercase tracking-[0.3em] text-xl italic">Učitavanje podataka</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-slate-900 border-2 border-red-500/30 p-10 rounded-3xl text-center shadow-2xl">
        <AlertTriangle size={40} className="text-red-500 mx-auto mb-6" />
        <h2 className="text-2xl font-black text-white uppercase italic mb-4">Greška</h2>
        <p className="text-slate-400 font-medium mb-8">{error}</p>
        <button onClick={() => navigate('/')} className="w-full bg-slate-800 text-white font-black py-4 rounded-xl border border-slate-700">Nazad na početnu</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-200 selection:bg-blue-500/30 font-sans antialiased max-w-full overflow-x-hidden">
      <CompetitionHeader
        competition={competition}
        onShare={onShare}
        publicVideoBanners={!categorySlug ? publicVideoBanners : []}
        publicSocialLinks={!categorySlug ? publicSocialLinks : []}
      />
      
      <div className="w-full max-w-full overflow-x-hidden">
        <Navigation 
          slug={slug} 
          categorySlug={categorySlug} 
          categories={categories} 
          showDropdown={showDropdown} 
          setShowDropdown={setShowDropdown} 
          isEmbed={isEmbed}
        />

        <CompetitionBody 
          competition={competition}
          slug={slug}
          categorySlug={categorySlug}
          categories={categories}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          competitionId={competition?.id}
          isEmbed={isEmbed}
          activeCategory={activeCategory}
          allMatches={allMatches}
          allPlayers={allPlayers}
        />
      </div>

      <GlobalUIElements 
        showAtTop={showAtTop} 
        selectedMatch={selectedMatch} 
        setSelectedMatch={setSelectedMatch} 
      />
    </div>
  );
};

export default PublicCompetitionNew;