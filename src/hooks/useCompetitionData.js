import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot } from 'firebase/firestore';

// Categories and matches are loaded by CompetitionDetails.jsx itself, scoped to the
// competitions/{id}/categories subcollection and the active category's matches -
// this hook used to also open its own unfiltered (all-categories) listeners for
// both, which duplicated those reads and raced with them to set the same state.
export const useCompetitionData = (id) => {
  const [competition, setCompetition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const unsubComp = onSnapshot(doc(db, 'competitions', id), (doc) => {
      if (doc.exists()) {
        setCompetition({ id: doc.id, ...doc.data() });
      } else {
        setError('Takmičenje nije pronađeno');
      }
      setLoading(false);
    });

    return () => {
      unsubComp();
    };
  }, [id]);

  return { competition, loading, error };
};
