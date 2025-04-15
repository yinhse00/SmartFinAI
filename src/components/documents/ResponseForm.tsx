
import { useResponseForm } from './hooks/useResponseForm';
import ResponseTypeSelector from './response/ResponseTypeSelector';
import PromptInput from './response/PromptInput';
import AutoSearchOption from './response/AutoSearchOption';
import RegulatoryContext from './response/RegulatoryContext';
import GeneratedResponseDisplay from './response/GeneratedResponseDisplay';
import GenerateButton from './response/GenerateButton';

const ResponseForm = () => {
  const {
    responseType,
    setResponseType,
    promptText,
    setPromptText,
    isGenerating,
    isSearchingRegulations,
    generatedResponse,
    useAutoRegSearch,
    setUseAutoRegSearch,
    regulatoryContext,
    isExporting,
    handleSearchRegulations,
    handleGenerateResponse,
    handleDownloadWord,
    handleDownloadExcel,
    handleDownloadPdf
  } = useResponseForm();

  return (
    <>
      <div className="space-y-4">
        <ResponseTypeSelector 
          value={responseType} 
          onChange={setResponseType} 
        />

        <PromptInput 
          value={promptText} 
          onChange={(e) => setPromptText(e.target.value)} 
        />
        
        <AutoSearchOption 
          checked={useAutoRegSearch}
          onCheckedChange={setUseAutoRegSearch}
          onSearch={handleSearchRegulations}
          isSearching={isSearchingRegulations}
          promptEmpty={!promptText.trim()}
        />
      </div>

      <RegulatoryContext context={regulatoryContext} />

      <GeneratedResponseDisplay 
        response={generatedResponse}
        isExporting={isExporting}
        onDownloadWord={handleDownloadWord}
        onDownloadPdf={handleDownloadPdf}
        onDownloadExcel={handleDownloadExcel}
      />

      <GenerateButton 
        onClick={handleGenerateResponse} 
        isGenerating={isGenerating} 
      />
    </>
  );
};

export default ResponseForm;
