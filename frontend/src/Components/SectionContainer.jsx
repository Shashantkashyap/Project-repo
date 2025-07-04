import React from 'react';
import { motion } from 'framer-motion';
import McqQuestion from './McqQuestion';

const SectionContainer = ({ section, onAnswerSelect, selectedOptions }) => {
  // Add debug logging
  console.log("Rendering SectionContainer", {
    sectionId: section.section_id,
    questions: section.questions,
    selectedOptions
  });

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <motion.div 
        className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 rounded-xl mb-6"
        whileHover={{ scale: 1.01 }}
      >
        <h1 className="text-2xl font-bold">
          {section.section_name}
        </h1>
        <p className="text-blue-100 mt-2">
        Please answer all questions below
        </p>
      </motion.div>
      
      <div className="space-y-6">
        {section.questions.map((question) => (
          <McqQuestion 
            key={question.question_id}
            question={question}
            onAnswerSelect={onAnswerSelect}
            selectedOptions={selectedOptions}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default SectionContainer;
