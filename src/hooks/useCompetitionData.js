import { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { doc, onSnapshot, collection, query, where } from 'firebase/firestore';

export const useCompetitionData = (id) => {
  const [competition, setCompetition] = useState(null);
  const [categories, setCategories] = useState([]);
  const [matches, setMatches] = useState([]);
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
    });

    const unsubCats = onSnapshot(
      query(collection(db, 'categories'), where('competitionId', '==', id)),
      (snapshot) => {
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    );

    const unsubMatches = onSnapshot(
      query(collection(db, 'matches'), where('competitionId', '==', id)),
      (snapshot) => {
        setMatches(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      }
    );

    return () => {
      unsubComp();
      unsubCats();
      unsubMatches();
    };
  }, [id]);

  return { competition, categories, matches, loading, error };
};
