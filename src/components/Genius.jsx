import React, { useState, useEffect } from 'react';
import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Play, Save, Star, RotateCcw, X } from 'lucide-react';

const tocarSom = (frequencia) => {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(frequencia, context.currentTime);
  gain.gain.setValueAtTime(0.5, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.00001, context.currentTime + 0.6);
  oscillator.connect(gain); gain.connect(context.destination);
  oscillator.start(); oscillator.stop(context.currentTime + 0.6);
};

const CORES = [
  { id: 0, freq: 164.81, color: '#ef4444', glow: '0 0 60px #ef4444', pos: 'rounded-tl-full' },
  { id: 1, freq: 220.00, color: '#3b82f6', glow: '0 0 60px #3b82f6', pos: 'rounded-tr-full' },
  { id: 2, freq: 277.18, color: '#22c55e', glow: '0 0 60px #22c55e', pos: 'rounded-bl-full' },
  { id: 3, freq: 329.63, color: '#eab308', glow: '0 0 60px #eab308', pos: 'rounded-br-full' }
];

export default function Genius() {
  const [sequencia, setSequencia] = useState([]);
  const [jogadaUser, setJogadaUser] = useState([]);
  const [estaExibindo, setEstaExibindo] = useState(false);
  const [corAtiva, setCorAtiva] = useState(null);
  const [status, setStatus] = useState('parado');
  const [ranking, setRanking] = useState([]);
  const [nome, setNome] = useState('');
  const [nota, setNota] = useState(5);
  const [modalAberto, setModalAberto] = useState(false);

  const buscarRanking = async () => {
    try {
      const q = query(collection(db, "ranking"), orderBy("score", "desc"), limit(10));
      const snap = await getDocs(q);
      setRanking(snap.docs.map(doc => doc.data()));
    } catch (e) { console.error(e); }
  };

  useEffect(() => { buscarRanking(); }, []);

  const iniciarJogo = () => {
    const novaSeq = [Math.floor(Math.random() * 4)];
    setSequencia(novaSeq); setJogadaUser([]); setStatus('jogando');
    tocarSequencia(novaSeq);
  };

  const tocarSequencia = async (seq) => {
    setEstaExibindo(true);
    for (const id of seq) {
      await new Promise(r => setTimeout(r, 600));
      setCorAtiva(id); tocarSom(CORES[id].freq);
      await new Promise(r => setTimeout(r, 400));
      setCorAtiva(null);
    }
    setEstaExibindo(false);
  };

  const validarClique = (id) => {
    if (estaExibindo || status !== 'jogando') return;
    tocarSom(CORES[id].freq); setCorAtiva(id);
    setTimeout(() => setCorAtiva(null), 200);
    const novaJogada = [...jogadaUser, id];
    setJogadaUser(novaJogada);
    if (id !== sequencia[novaJogada.length - 1]) { setStatus('perdeu'); return; }
    if (novaJogada.length === sequencia.length) {
      const proximaSeq = [...sequencia, Math.floor(Math.random() * 4)];
      setSequencia(proximaSeq); setJogadaUser([]);
      setTimeout(() => tocarSequencia(proximaSeq), 1000);
    }
  };

  const salvarNoFirebase = async () => {
    if (!nome.trim()) return;
    await addDoc(collection(db, "ranking"), { nome, score: sequencia.length - 1, nota });
    setNome(''); setStatus('parado'); buscarRanking();
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen p-4">
      <div className="relative mb-12">
        <div className="relative grid grid-cols-2 gap-4 p-8 bg-white/5 border border-white/10 rounded-full backdrop-blur-3xl w-[320px] h-[320px] md:w-[500px] md:h-[500px] shadow-2xl">
          {CORES.map((cor) => (
            <motion.button key={cor.id} whileTap={{ scale: 0.94 }} onClick={() => validarClique(cor.id)}
              style={{ backgroundColor: cor.color, boxShadow: corAtiva === cor.id ? cor.glow : 'none' }}
              className={`w-full h-full ${cor.pos} transition-all duration-300 border-8 border-black/30 
                ${corAtiva === cor.id ? 'brightness-150 scale-105 z-10' : 'brightness-50 opacity-40 hover:opacity-100'}`} />
          ))}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-28 h-28 md:w-48 md:h-48 bg-[#030712] rounded-full border-8 border-white/10 flex flex-col items-center justify-center shadow-2xl z-20">
              <span className="text-white font-black text-xs md:text-lg italic tracking-tighter">GENIUS</span>
              <span className="text-cyan-400 font-light text-[10px] md:text-sm uppercase tracking-[0.2em]">do Rikas</span>
              {status === 'jogando' && (
                <span className="mt-1 text-2xl md:text-4xl font-black text-white">{sequencia.length - 1}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        {status === 'parado' && (
          <button onClick={iniciarJogo} className="w-full py-4 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-cyan-400 transition-all uppercase tracking-widest text-sm shadow-xl shadow-cyan-500/20">
            <Play size={20} fill="black"/> Iniciar Jogo
          </button>
        )}

        <button onClick={() => { buscarRanking(); setModalAberto(true); }} className="w-full py-4 bg-white/5 border border-white/10 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all uppercase tracking-widest text-xs">
          <Trophy size={18} className="text-yellow-500"/> Ver Leaderboard
        </button>
      </div>

      <AnimatePresence>
        {status === 'perdeu' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-sm bg-[#0a0f1e] border border-white/10 p-8 rounded-[3rem] shadow-2xl space-y-6 text-center">
              <h3 className="text-3xl font-black text-red-500 uppercase italic tracking-tighter">Game Over</h3>
              <p className="text-gray-400 text-sm">Você alcançou o nível <span className="text-white font-bold">{sequencia.length - 1}</span></p>
              
              <div className="space-y-4">
                <input type="text" placeholder="Seu Nickname" value={nome} onChange={e => setNome(e.target.value)} 
                  className="w-full p-4 bg-black/50 border border-white/10 rounded-2xl text-white text-center outline-none focus:border-cyan-400" />
                
                <div className="flex flex-col items-center gap-2">
                  <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Avalie o projeto</span>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} size={28} onClick={() => setNota(s)} className={`cursor-pointer transition-colors ${s <= nota ? 'text-yellow-400 fill-yellow-400' : 'text-gray-700'}`} />
                    ))}
                  </div>
                </div>

                <button onClick={salvarNoFirebase} className="w-full py-4 bg-cyan-500 text-black font-black rounded-xl uppercase text-xs tracking-widest hover:bg-white transition-colors">
                  <Save size={18}/> Salvar Recorde
                </button>
                <button onClick={iniciarJogo} className="w-full py-4 bg-white/5 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-xs uppercase hover:bg-white/10">
                  <RotateCcw size={16}/> Tentar de novo
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {modalAberto && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-md bg-[#0a0f1e] border border-white/10 p-8 rounded-[3rem] shadow-2xl relative">
              <button onClick={() => setModalAberto(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
                <X size={24}/>
              </button>
              
              <div className="flex items-center gap-3 mb-8">
                <Trophy size={24} className="text-yellow-500"/>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Leaderboard</h3>
              </div>

              <div className="space-y-3">
                {ranking.map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-cyan-400 font-black text-xs">#{i + 1}</span>
                      <span className="text-sm font-bold text-gray-200">{item.nome}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Star size={10} className="text-yellow-500 fill-yellow-500"/>
                        <span className="text-[10px] text-gray-500 font-black">{item.nota || 0}</span>
                      </div>
                      <span className="text-sm font-black text-white">{item.score} <span className="text-[8px] text-gray-600">PTS</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}