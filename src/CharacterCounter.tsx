import React, { useState, useEffect } from 'react';
import { AlertCircle, FileText, Clock, Copy, Download, Cpu, BarChart2, Moon, Sun, Repeat } from 'lucide-react';

const CharacterCounter = () => {
  const [text, setText] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [aiAnalysisActive, setAiAnalysisActive] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState(null);
  const [frequencyData, setFrequencyData] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  const [wordCloudData, setWordCloudData] = useState([]);
  
  const [stats, setStats] = useState({
    characters: 0,
    charactersNoSpaces: 0,
    words: 0,
    sentences: 0,
    paragraphs: 0,
    readingTime: 0,
    speakingTime: 0,
  });

  useEffect(() => {
    analyzeText(text);
  }, [text]);

  const analyzeText = (text) => {
    // Basic stats
    const characters = text.length;
    const charactersNoSpaces = text.replace(/\s/g, '').length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const sentences = text.trim() === '' ? 0 : text.split(/[.!?]+/).filter(Boolean).length;
    const paragraphs = text.trim() === '' ? 0 : text.split(/\n\s*\n/).filter(Boolean).length;
    
    // Read/speak time
    const readingTime = words / 250;
    const speakingTime = words / 150;

    setStats({
      characters,
      charactersNoSpaces,
      words,
      sentences,
      paragraphs,
      readingTime,
      speakingTime,
    });

    // Character frequency analysis
    if (text.length > 0) {
      const charFreq = {};
      for (const char of text) {
        if (char.trim() !== '') {
          charFreq[char] = (charFreq[char] || 0) + 1;
        }
      }
      
      const freqArray = Object.entries(charFreq)
        .map(([char, count]) => ({ char, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);
      
      setFrequencyData(freqArray);
    } else {
      setFrequencyData([]);
    }
    
    // Generate heatmap data
    if (text.length > 0) {
      const paragraphs = text.split(/\n\s*\n/).filter(Boolean);
      const heatmap = paragraphs.map((para, paraIndex) => {
        const sentences = para.split(/[.!?]+/).filter(Boolean);
        return {
          index: paraIndex,
          sentences: sentences.map((sentence, sentIndex) => {
            const words = sentence.split(/\s+/).length;
            // Complexity is a simple function of sentence length
            const complexity = Math.min(1, words / 25);
            return {
              index: sentIndex,
              text: sentence,
              words,
              complexity
            };
          })
        };
      });
      setHeatmapData(heatmap);
    } else {
      setHeatmapData([]);
    }
    
    // Generate word cloud data
    if (text.length > 0) {
      const stopWords = ['the', 'and', 'to', 'of', 'a', 'in', 'for', 'is', 'on', 'that', 'by', 'this', 'with', 'i', 'you', 'it'];
      const words = text.toLowerCase().match(/\b\w+\b/g) || [];
      const wordFreq = {};
      
      words.filter(word => !stopWords.includes(word) && word.length > 2)
        .forEach(word => {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        });
      
      const wordCloudArray = Object.entries(wordFreq)
        .map(([word, count]) => ({ text: word, value: count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 50);
      
      setWordCloudData(wordCloudArray);
    } else {
      setWordCloudData([]);
    }
  };

  const performAiAnalysis = () => {
    if (text.length < 10) {
      setAiResults({
        readability: 0,
        suggestions: ["Add more text for analysis"],
        tone: "N/A",
        sentiment: "N/A"
      });
      return;
    }
    
    setAiLoading(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      // Calculate readability score (Flesch Reading Ease simplified)
      const words = text.trim().split(/\s+/).length;
      const sentences = text.split(/[.!?]+/).filter(Boolean).length;
      const syllables = estimateSyllables(text);
      
      let readabilityScore = 0;
      if (words > 0 && sentences > 0) {
        readabilityScore = Math.min(100, Math.max(0, 
          206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / Math.max(words, 1))
        ));
      }
      
      // Generate suggestions
      const suggestions = [];
      
      if (words / Math.max(sentences, 1) > 25) {
        suggestions.push("Consider using shorter sentences for better readability.");
      }
      
      if (text.length / Math.max(words, 1) > 6) {
        suggestions.push("Your text uses many long words. Consider simplifying vocabulary for wider audience.");
      }
      
      if (paragraphsToSentencesRatio() < 0.2) {
        suggestions.push("Consider breaking your text into more paragraphs for better structure.");
      }
      
      // Determine tone and sentiment
      const tone = readabilityScore > 70 ? "Conversational" : 
                    readabilityScore > 50 ? "Neutral" : "Formal";
      
      const sentiment = analyzeSentiment();
      
      setAiResults({
        readabilityScore: Math.round(readabilityScore),
        suggestions: suggestions.length > 0 ? suggestions : ["Your text looks good!"],
        tone,
        sentiment
      });
      
      setAiLoading(false);
      setAiAnalysisActive(true);
    }, 800);
  };
  
  // Rough syllable estimation
  const estimateSyllables = (text) => {
    if (!text) return 0;
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    let count = 0;
    
    words.forEach(word => {
      // Count vowel groups as syllables
      let syllables = word.match(/[aeiouy]{1,2}/g)?.length || 0;
      
      // Adjust for silent e
      if (word.endsWith('e') && !word.endsWith('le') && syllables > 0) {
        syllables--;
      }
      
      // Ensure at least one syllable per word
      count += Math.max(1, syllables);
    });
    
    return count;
  };
  
  // Calculate paragraphs to sentences ratio
  const paragraphsToSentencesRatio = () => {
    const sentences = text.split(/[.!?]+/).filter(Boolean).length;
    const paragraphs = text.split(/\n\s*\n/).filter(Boolean).length;
    return paragraphs / Math.max(sentences, 1);
  };
  
  // Simple sentiment analysis
  const analyzeSentiment = () => {
    const positiveWords = ['good', 'great', 'excellent', 'best', 'love', 'happy', 'positive', 'wonderful', 'amazing'];
    const negativeWords = ['bad', 'terrible', 'awful', 'worst', 'hate', 'sad', 'negative', 'poor', 'horrible'];
    
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    if (positiveCount > negativeCount * 2) return "Very Positive";
    if (positiveCount > negativeCount) return "Somewhat Positive";
    if (negativeCount > positiveCount * 2) return "Very Negative";
    if (negativeCount > positiveCount) return "Somewhat Negative";
    return "Neutral";
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(text);
  };

  const exportText = () => {
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "text-analysis.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const clearText = () => {
    setText('');
  };

  const formatTime = (timeInMinutes) => {
    if (timeInMinutes < 1/60) {
      return "< 1 second";
    }
    if (timeInMinutes < 1) {
      return `${Math.ceil(timeInMinutes * 60)} seconds`;
    }
    const minutes = Math.floor(timeInMinutes);
    const seconds = Math.ceil((timeInMinutes - minutes) * 60);
    return `${minutes} min${minutes !== 1 ? 's' : ''} ${seconds} sec${seconds !== 1 ? 's' : ''}`;
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const renderHeatmap = () => {
    if (heatmapData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <AlertCircle size={20} className="mr-2" />
          <span>Add more text to generate heat map</span>
        </div>
      );
    }
    
    // Define complexity categories for legend
    const complexityLevels = [
      { name: "Very Easy", range: "0-20%", color: "rgb(220, 220, 255)" },
      { name: "Easy", range: "20-40%", color: "rgb(180, 180, 255)" },
      { name: "Moderate", range: "40-60%", color: "rgb(120, 120, 255)" },
      { name: "Complex", range: "60-80%", color: "rgb(60, 60, 255)" },
      { name: "Very Complex", range: "80-100%", color: "rgb(20, 20, 200)" }
    ];
    
    return (
      <div className="space-y-6">
        {/* Legend */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2">Sentence Complexity</h3>
          <div className="flex flex-wrap gap-2">
            {complexityLevels.map((level, i) => (
              <div key={i} className="flex items-center">
                <div className="w-4 h-4 mr-1" style={{ backgroundColor: level.color }}></div>
                <span className="text-xs mr-3">{level.name}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Heatmap visualization */}
        <div className="overflow-x-auto">
          {heatmapData.map((paragraph, index) => (
            <div key={index} className="mb-8">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-medium">Paragraph {index + 1}</div>
                <div className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700">
                  {paragraph.sentences.length} sentences
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                {paragraph.sentences.map((sentence, sIndex) => {
                  // Enhanced complexity calculation (exposed as percentage)
                  const complexityPercent = Math.min(100, Math.round(sentence.complexity * 100));
                  
                  // More nuanced color gradient
                  const blueValue = Math.max(20, 255 - (complexityPercent * 2.35));
                  const redGreenValue = Math.max(20, 255 - (complexityPercent * 1.5));
                  const bgColor = `rgb(${redGreenValue}, ${redGreenValue}, ${blueValue})`;
                  
                  // Text color based on background darkness
                  const textColor = complexityPercent > 40 ? 'white' : 'black';
                  
                  // Analyze additional patterns in the sentence
                  const hasLongWords = sentence.text.match(/\b\w{10,}\b/) !== null;
                  const hasPassiveVoice = /\b(is|are|was|were|be|been|being)\s+\w+ed\b/i.test(sentence.text);
                  const hasComplexStructure = sentence.text.split(/,|;/).length > 2;
                  
                  return (
                    <div 
                      key={sIndex} 
                      className="p-3 rounded shadow-sm transition-all duration-200 hover:shadow-md"
                      style={{ backgroundColor: bgColor, color: textColor }}
                    >
                      <div className="flex justify-between items-center text-xs mb-2">
                        <div className="font-medium flex items-center">
                          <span>S{sIndex + 1}</span>
                          <span className="mx-2">•</span>
                          <span>{sentence.words} words</span>
                        </div>
                        <div className="font-bold">
                          {complexityPercent}% complexity
                        </div>
                      </div>
                      
                      <div className="text-sm mb-2">{sentence.text}</div>
                      
                      {/* Analysis tags */}
                      {(hasLongWords || hasPassiveVoice || hasComplexStructure) && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {hasLongWords && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-opacity-20 bg-yellow-500 text-yellow-800 dark:text-yellow-200">
                              Long words
                            </span>
                          )}
                          {hasPassiveVoice && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-opacity-20 bg-purple-500 text-purple-800 dark:text-purple-200">
                              Passive voice
                            </span>
                          )}
                          {hasComplexStructure && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-opacity-20 bg-orange-500 text-orange-800 dark:text-orange-200">
                              Complex structure
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Paragraph summary */}
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Average complexity: {Math.round(paragraph.sentences.reduce((sum, s) => sum + s.complexity * 100, 0) / paragraph.sentences.length)}%
              </div>
            </div>
          ))}
        </div>
        
        {/* Overall text insights */}
        <div className={`p-3 rounded-lg mt-4 ${darkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
          <h3 className="font-medium mb-2">Text Structure Insights</h3>
          <ul className="space-y-1 text-sm">
            <li>• Average sentence complexity: {Math.round(heatmapData.flatMap(p => p.sentences).reduce((sum, s) => sum + s.complexity * 100, 0) / heatmapData.flatMap(p => p.sentences).length)}%</li>
            <li>• Sentence length variation: {Math.round(Math.max(...heatmapData.flatMap(p => p.sentences).map(s => s.words)) - Math.min(...heatmapData.flatMap(p => p.sentences).map(s => s.words)))} words</li>
            <li>• Longest sentence: {Math.max(...heatmapData.flatMap(p => p.sentences).map(s => s.words))} words</li>
            <li>• Most complex paragraph: #{heatmapData.findIndex(p => 
              p.sentences.reduce((sum, s) => sum + s.complexity, 0) / p.sentences.length === 
              Math.max(...heatmapData.map(p => p.sentences.reduce((sum, s) => sum + s.complexity, 0) / p.sentences.length))
              ) + 1}
            </li>
          </ul>
        </div>
      </div>
    );
  };
  
  const renderWordCloud = () => {
    if (wordCloudData.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <AlertCircle size={20} className="mr-2" />
          <span>Add more text to generate word cloud</span>
        </div>
      );
    }
    
    const maxFreq = wordCloudData[0].value;
    const minFreq = wordCloudData[wordCloudData.length - 1].value;
    
    return (
      <div className="flex flex-wrap justify-center p-4">
        {wordCloudData.slice(0, 30).map((word, index) => {
          // Scale font size between 0.8rem and 2.5rem based on frequency
          const fontSize = 0.8 + ((word.value - minFreq) / Math.max(1, maxFreq - minFreq)) * 1.7;
          // Generate a color based on the word's frequency
          const hue = (index * 137) % 360;
          
          return (
            <div 
              key={index}
              className="m-2 px-2 py-1"
              style={{ 
                fontSize: `${fontSize}rem`,
                color: `hsl(${hue}, 70%, 50%)`,
                fontWeight: fontSize > 1.5 ? 'bold' : 'normal'
              }}
            >
              {word.text}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`flex flex-col min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      {/* Header */}
      <header className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Advanced Character Counter</h1>
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleDarkMode} 
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-grow p-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Input area */}
            <div className="md:col-span-2">
              <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold">Input Text</h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={copyToClipboard} 
                      className={`p-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition`}
                      title="Copy to clipboard"
                    >
                      <Copy size={16} />
                    </button>
                    <button 
                      onClick={exportText} 
                      className={`p-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition`}
                      title="Export as text file"
                    >
                      <Download size={16} />
                    </button>
                    <button 
                      onClick={clearText} 
                      className={`p-2 rounded ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition`}
                      title="Clear text"
                    >
                      <Repeat size={16} />
                    </button>
                  </div>
                </div>
                <textarea
                  className={`w-full h-64 p-3 border rounded-md focus:outline-none focus:ring-2 ${
                    darkMode 
                      ? 'bg-gray-700 border-gray-600 focus:ring-blue-500' 
                      : 'bg-gray-50 border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="Type or paste your text here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                ></textarea>
              </div>
            </div>

            {/* Stats panel */}
            <div className="md:col-span-1">
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm mb-4`}>
                <h2 className="text-xl font-semibold mb-4">Text Statistics</h2>
                
                <div className="flex justify-between mb-2 items-center">
                  <button 
                    onClick={() => setActiveTab('basic')} 
                    className={`py-2 px-4 rounded-t-lg ${
                      activeTab === 'basic' 
                        ? darkMode ? 'bg-gray-700 text-white' : 'bg-blue-100 text-blue-800' 
                        : darkMode ? 'bg-gray-800' : 'bg-gray-100'
                    }`}
                  >
                    Basic
                  </button>
                  <button 
                    onClick={() => setActiveTab('advanced')} 
                    className={`py-2 px-4 rounded-t-lg ${
                      activeTab === 'advanced' 
                        ? darkMode ? 'bg-gray-700 text-white' : 'bg-blue-100 text-blue-800' 
                        : darkMode ? 'bg-gray-800' : 'bg-gray-100'
                    }`}
                  >
                    Advanced
                  </button>
                  <button 
                    onClick={() => {
                      setActiveTab('ai');
                      if (!aiAnalysisActive) performAiAnalysis();
                    }} 
                    className={`py-2 px-4 rounded-t-lg ${
                      activeTab === 'ai' 
                        ? darkMode ? 'bg-gray-700 text-white' : 'bg-blue-100 text-blue-800' 
                        : darkMode ? 'bg-gray-800' : 'bg-gray-100'
                    }`}
                  >
                    AI Analysis
                  </button>
                </div>

                <div className={`p-4 rounded-b-lg rounded-tr-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  {activeTab === 'basic' && (
                    <div className="space-y-4">
                      <div className={`flex justify-between p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <span className="font-medium">Characters:</span>
                        <span className="font-bold">{stats.characters}</span>
                      </div>
                      <div className={`flex justify-between p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <span className="font-medium">Characters (no spaces):</span>
                        <span className="font-bold">{stats.charactersNoSpaces}</span>
                      </div>
                      <div className={`flex justify-between p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <span className="font-medium">Words:</span>
                        <span className="font-bold">{stats.words}</span>
                      </div>
                      <div className={`flex justify-between p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <span className="font-medium">Sentences:</span>
                        <span className="font-bold">{stats.sentences}</span>
                      </div>
                      <div className={`flex justify-between p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <span className="font-medium">Paragraphs:</span>
                        <span className="font-bold">{stats.paragraphs}</span>
                      </div>
                    </div>
                  )}

                  {activeTab === 'advanced' && (
                    <div className="space-y-4">
                      <div className={`flex justify-between p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <span className="font-medium">Reading Time:</span>
                        <span className="font-bold">{formatTime(stats.readingTime)}</span>
                      </div>
                      <div className={`flex justify-between p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <span className="font-medium">Speaking Time:</span>
                        <span className="font-bold">{formatTime(stats.speakingTime)}</span>
                      </div>
                      <div className={`flex justify-between p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <span className="font-medium">Avg. Word Length:</span>
                        <span className="font-bold">
                          {stats.words > 0 
                            ? (stats.charactersNoSpaces / stats.words).toFixed(1) 
                            : '0'} chars
                        </span>
                      </div>
                      <div className={`flex justify-between p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                        <span className="font-medium">Avg. Sentence Length:</span>
                        <span className="font-bold">
                          {stats.sentences > 0 
                            ? (stats.words / stats.sentences).toFixed(1) 
                            : '0'} words
                        </span>
                      </div>
                      
                      {frequencyData.length > 0 && (
                        <div className={`mt-4 p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                          <h3 className="font-medium mb-2">Most Common Characters:</h3>
                          <div className="grid grid-cols-3 gap-1 text-sm">
                            {frequencyData.slice(0, 6).map((item, index) => (
                              <div key={index} className="flex justify-between">
                                <span className="font-mono">{item.char === ' ' ? '␣' : item.char}</span>
                                <span>{item.count}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'ai' && (
                    <div className="space-y-4">
                      {aiLoading ? (
                        <div className="flex justify-center items-center h-32">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                        </div>
                      ) : aiResults ? (
                        <>
                          <div className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className="flex justify-between items-center">
                              <span className="font-medium">Readability:</span>
                              <div className="flex items-center">
                                <div className="w-16 h-4 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${
                                      aiResults.readabilityScore > 80 ? 'bg-green-500' : 
                                      aiResults.readabilityScore > 60 ? 'bg-yellow-500' : 
                                      aiResults.readabilityScore > 40 ? 'bg-orange-500' : 'bg-red-500'
                                    }`}
                                    style={{width: `${aiResults.readabilityScore}%`}}
                                  ></div>
                                </div>
                                <span className="ml-2 font-bold">{aiResults.readabilityScore}/100</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className="font-medium mb-1">Detected Tone:</div>
                            <div className="font-bold">{aiResults.tone}</div>
                          </div>
                          
                          <div className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                            <div className="font-medium mb-1">Overall Sentiment:</div>
                            <div className="font-bold">{aiResults.sentiment}</div>
                          </div>
                          
                          {aiResults.suggestions.length > 0 && (
                            <div className={`p-2 rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                              <div className="font-medium mb-1">Suggestions:</div>
                              <ul className="list-disc pl-5 space-y-1">
                                {aiResults.suggestions.map((suggestion, index) => (
                                  <li key={index} className="text-sm">{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          <button 
                            onClick={performAiAnalysis}
                            className={`mt-2 w-full p-2 rounded ${
                              darkMode 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            <div className="flex items-center justify-center">
                              <Cpu size={16} className="mr-2" />
                              Regenerate Analysis
                            </div>
                          </button>
                        </>
                      ) : (
                        <div className="flex justify-center items-center h-32">
                          <button 
                            onClick={performAiAnalysis}
                            className={`p-2 rounded ${
                              darkMode 
                                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            <div className="flex items-center">
                              <Cpu size={16} className="mr-2" />
                              Generate AI Analysis
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Visualization section */}
          {text.length > 0 && (
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm mt-4`}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Text Visualization</h2>
                <div className="flex space-x-2">
                  <button
                    className={`px-3 py-1 rounded ${activeTab === 'heatmap' 
                      ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') 
                      : (darkMode ? 'bg-gray-700' : 'bg-gray-200')}`}
                    onClick={() => setActiveTab('heatmap')}
                  >
                    Heatmap
                  </button>
                  <button
                    className={`px-3 py-1 rounded ${activeTab === 'wordcloud' 
                      ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') 
                      : (darkMode ? 'bg-gray-700' : 'bg-gray-200')}`}
                    onClick={() => setActiveTab('wordcloud')}
                  >
                    Word Cloud
                  </button>
                </div>
              </div>
              
              <div className="h-96 overflow-auto">
                {activeTab === 'heatmap' ? renderHeatmap() : renderWordCloud()}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className={`p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-inner mt-4`}>
        <div className="container mx-auto flex justify-between items-center text-sm">
          <div className="flex items-center">
            <FileText size={16} className="mr-2" />
            <span>Advanced Character Counter | © 2025</span>
          </div>
          <div className="flex items-center">
            <Clock size={16} className="mr-2" />
            <span>Updated March 2025</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CharacterCounter;