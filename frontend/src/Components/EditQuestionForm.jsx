import React, { useState } from 'react';
import { updateQuestion } from '../api/questions';

function EditQuestionForm({ initialQuestion, onSuccess, onCancel }) {
  const [questionText, setQuestionText] = useState(initialQuestion.question_text);
  const [options, setOptions] = useState(initialQuestion.options);

  const handleOptionChange = (idx, field, value) => {
    setOptions(options.map((opt, i) =>
      i === idx ? { ...opt, [field]: value } : opt
    ));
  };

  const handleAddOption = () => {
    setOptions([...options, { option_id: 0, option_text: '', rating: 1 }]);
  };

  const handleRemoveOption = (idx) => {
    setOptions(options.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateQuestion({
        question_id: initialQuestion.question_id,
        question_text: questionText,
        options,
      });
      onSuccess();
    } catch (err) {
      alert('Failed to update question');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Question Text:</label>
        <input
          value={questionText}
          onChange={e => setQuestionText(e.target.value)}
          required
        />
      </div>
      <div>
        <label>Options:</label>
        {options.map((opt, idx) => (
          <div key={idx}>
            <input
              value={opt.option_text}
              onChange={e => handleOptionChange(idx, 'option_text', e.target.value)}
              required
              placeholder="Option text"
            />
            <input
              type="number"
              value={opt.rating}
              onChange={e => handleOptionChange(idx, 'rating', Number(e.target.value))}
              required
              placeholder="Rating"
            />
            <button type="button" onClick={() => handleRemoveOption(idx)}>Remove</button>
          </div>
        ))}
        <button type="button" onClick={handleAddOption}>Add Option</button>
      </div>
      <button type="submit">Save</button>
      <button type="button" onClick={onCancel}>Cancel</button>
    </form>
  );
}

export default EditQuestionForm;
