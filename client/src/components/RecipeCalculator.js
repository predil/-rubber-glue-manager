import React, { useState } from 'react';

function RecipeCalculator() {
  const [latexAmount, setLatexAmount] = useState(170);
  const [recipe, setRecipe] = useState(null);

  // Base recipe for 170kg latex
  const baseRecipe = {
    latex: 170,
    coconutOil: 190,
    waterForOil: 100,
    koh: 50,
    waterForKoh: 50,
    hec: 135,
    waterForHec: 5000, // 5L = 5000ml
    sodiumBenzoate: 170,
    waterForPreservative: 1700
  };

  const calculateRecipe = () => {
    const ratio = latexAmount / baseRecipe.latex;
    
    const calculated = {
      latex: latexAmount,
      coconutOil: Math.round(baseRecipe.coconutOil * ratio * 10) / 10,
      waterForOil: Math.round(baseRecipe.waterForOil * ratio),
      koh: Math.round(baseRecipe.koh * ratio * 10) / 10,
      waterForKoh: Math.round(baseRecipe.waterForKoh * ratio),
      hec: Math.round(baseRecipe.hec * ratio * 10) / 10,
      waterForHec: Math.round(baseRecipe.waterForHec * ratio),
      sodiumBenzoate: Math.round(baseRecipe.sodiumBenzoate * ratio * 10) / 10,
      waterForPreservative: Math.round(baseRecipe.waterForPreservative * ratio)
    };

    setRecipe(calculated);
  };

  const resetCalculator = () => {
    setLatexAmount(170);
    setRecipe(null);
  };

  return (
    <div>
      <div className="section">
        <div className="section-title">🧪 Latex Glue Recipe Calculator</div>
        
        <div className="form-grid" style={{ gridTemplateColumns: '1fr auto auto', alignItems: 'end' }}>
          <div className="form-group">
            <label>Rubber Latex Amount (kg)</label>
            <input
              type="number"
              step="0.1"
              value={latexAmount}
              onChange={(e) => setLatexAmount(parseFloat(e.target.value) || 0)}
              placeholder="Enter latex amount in kg"
            />
          </div>
          
          <button 
            className="btn btn-primary"
            onClick={calculateRecipe}
            disabled={!latexAmount || latexAmount <= 0}
          >
            Calculate Recipe
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={resetCalculator}
          >
            Reset
          </button>
        </div>
      </div>

      {recipe && (
        <>
          <div className="section">
            <div className="section-title">📋 Chemical Requirements</div>
            
            <div className="recipe-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              <div className="ingredient-card" style={{
                padding: '1rem',
                border: '2px solid #2d5a27',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa'
              }}>
                <h4>🥥 Coconut Oil Mix</h4>
                <ul>
                  <li><strong>{recipe.coconutOil}g</strong> Coconut Oil</li>
                  <li><strong>{recipe.waterForOil}ml</strong> Water (50°C)</li>
                </ul>
              </div>

              <div className="ingredient-card" style={{
                padding: '1rem',
                border: '2px solid #4a7c59',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa'
              }}>
                <h4>⚗️ KOH Solution</h4>
                <ul>
                  <li><strong>{recipe.koh}g</strong> KOH</li>
                  <li><strong>{recipe.waterForKoh}ml</strong> Water (50°C)</li>
                </ul>
              </div>

              <div className="ingredient-card" style={{
                padding: '1rem',
                border: '2px solid #74a085',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa'
              }}>
                <h4>🧪 HEC Solution</h4>
                <ul>
                  <li><strong>{recipe.hec}g</strong> HEC</li>
                  <li><strong>{(recipe.waterForHec/1000).toFixed(1)}L</strong> Water (50°C)</li>
                </ul>
              </div>

              <div className="ingredient-card" style={{
                padding: '1rem',
                border: '2px solid #8db4a0',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa'
              }}>
                <h4>🛡️ Preservative</h4>
                <ul>
                  <li><strong>{recipe.sodiumBenzoate}g</strong> Sodium Benzoate</li>
                  <li><strong>{(recipe.waterForPreservative/1000).toFixed(1)}L</strong> Water (50°C)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-title">📝 Production Procedure</div>
            
            <div className="procedure-steps">
              <div className="step" style={{
                padding: '1rem',
                margin: '1rem 0',
                border: '1px solid #ddd',
                borderRadius: '8px',
                borderLeft: '4px solid #2d5a27'
              }}>
                <h4>Step 1: Prepare Coconut Oil Mix</h4>
                <p>Mix <strong>{recipe.coconutOil}g coconut oil</strong> with <strong>{recipe.waterForOil}ml of 50°C water</strong>. Stir well until combined.</p>
              </div>

              <div className="step" style={{
                padding: '1rem',
                margin: '1rem 0',
                border: '1px solid #ddd',
                borderRadius: '8px',
                borderLeft: '4px solid #4a7c59'
              }}>
                <h4>Step 2: Prepare KOH Solution</h4>
                <p>Mix <strong>{recipe.koh}g KOH</strong> with <strong>{recipe.waterForKoh}ml of 50°C water</strong>. Add this solution to the coconut oil mix <strong>gradually</strong> and mix well.</p>
              </div>

              <div className="step" style={{
                padding: '1rem',
                margin: '1rem 0',
                border: '1px solid #ddd',
                borderRadius: '8px',
                borderLeft: '4px solid #74a085'
              }}>
                <h4>Step 3: Add to Latex</h4>
                <p>Add the coconut oil + KOH mixture to <strong>{recipe.latex}kg rubber latex</strong>. Mix thoroughly for <strong>15 minutes</strong>.</p>
              </div>

              <div className="step" style={{
                padding: '1rem',
                margin: '1rem 0',
                border: '1px solid #ddd',
                borderRadius: '8px',
                borderLeft: '4px solid #8db4a0'
              }}>
                <h4>Step 4: Prepare HEC Solution</h4>
                <p>Dilute <strong>{recipe.hec}g HEC</strong> in <strong>{(recipe.waterForHec/1000).toFixed(1)}L of 50°C water</strong>. Add this to the latex mixture and mix thoroughly for <strong>30 minutes</strong>.</p>
              </div>

              <div className="step" style={{
                padding: '1rem',
                margin: '1rem 0',
                border: '1px solid #ddd',
                borderRadius: '8px',
                borderLeft: '4px solid #a5c9b5'
              }}>
                <h4>Step 5: Add Preservative</h4>
                <p>Mix <strong>{recipe.sodiumBenzoate}g sodium benzoate</strong> with <strong>{(recipe.waterForPreservative/1000).toFixed(1)}L of 50°C water</strong>. Add to the latex mixture and mix well.</p>
              </div>

              <div className="final-note" style={{
                padding: '1.5rem',
                margin: '2rem 0',
                backgroundColor: '#d4edda',
                border: '1px solid #c3e6cb',
                borderRadius: '8px'
              }}>
                <h4>✅ Final Product</h4>
                <p><strong>Total Latex Glue:</strong> Approximately {(
                  recipe.latex + 
                  recipe.coconutOil/1000 + 
                  recipe.waterForOil/1000 + 
                  recipe.koh/1000 + 
                  recipe.waterForKoh/1000 + 
                  recipe.hec/1000 + 
                  recipe.waterForHec/1000 + 
                  recipe.sodiumBenzoate/1000 + 
                  recipe.waterForPreservative/1000
                ).toFixed(1)}kg</p>
                <p><strong>Processing Time:</strong> ~1 hour (mixing + preparation)</p>
                <p><strong>Temperature:</strong> All water should be at 50°C for optimal mixing</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default RecipeCalculator;