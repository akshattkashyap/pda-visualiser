import React from 'react';
import { usePDA } from './store/usePDA';
import DefinitionPanel from './components/DefinitionPanel';
import SimulationPanel from './components/SimulationPanel';
import Controls from './components/Controls';
import './styles/app.css';

export default function App() {
  const pdaStore = usePDA();

  return (
    <div className="min-h-screen flex flex-col md:flex-row p-4 gap-4 max-w-[1800px] mx-auto auto-rows-fr">
      
      {/* Left Column: Definition Editor */}
      <div className="w-full md:w-[450px] lg:w-[500px] glass-panel flex flex-col flex-none max-h-[85vh]">
        <DefinitionPanel 
          pdaDef={pdaStore.pdaDef}
          setPdaDef={pdaStore.setPdaDef}
          inputString={pdaStore.inputString}
          setInput={pdaStore.setInput}
          load={pdaStore.load}
        />
      </div>

      {/* Right Column: Active Simulation */}
      <div className="flex-1 glass-panel flex flex-col overflow-hidden max-h-[92vh]">
        <div className="flex-1 overflow-hidden">
          <SimulationPanel 
            pdaDef={pdaStore.pdaDef}
            currentConfig={pdaStore.currentConfig}
          />
        </div>

        {/* Global Controls docked at bottom of simulation */}
        <div className="flex-none">
          <Controls 
            forward={pdaStore.forward}
            backward={pdaStore.backward}
            reset={pdaStore.reset}
            speed={pdaStore.speed}
            setSpeed={pdaStore.setSpeed}
            isRunning={pdaStore.isRunning}
            setRunning={pdaStore.setRunning}
            canGoBack={pdaStore.currentConfig && pdaStore.currentConfig.log.length > 0}
            canGoForward={pdaStore.currentConfig && pdaStore.currentConfig.accepted === null}
          />
        </div>
      </div>
      
    </div>
  );
}
