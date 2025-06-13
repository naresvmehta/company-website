const Joi = require("joi");

module.exports.productSchema = Joi.object({
  title: Joi.string().required().messages({
    "string.empty": "Plant name is required",
    "any.required": "Plant name is required"
  }),             
  description: Joi.string().allow("").optional()
});



module.exports.loginSchema = Joi.object({
  username: Joi.string().required().messages({
    "string.empty": "Username is required",
    "any.required": "Username is required"
  }),
  password: Joi.string().required().messages({
    "string.empty": "Password is required",
    "any.required": "Password is required"
  })
});



module.exports.enquirySchema = Joi.object({
contact:Joi.object({
  name: Joi.string()
    .required()
    .messages({
      "string.empty": "Name is required",
      "any.required": "Name is required"
    }),

  email: Joi.string()
    .email({ tlds: { allow: false } }) //Emails from any domain for flexibility
    .required()
    .messages({
      "string.empty": "Email is required",
      "any.required": "Email is required",
      "string.email": "Please enter a valid email address"
    }),

  phone: Joi.string()
    .pattern(/^[0-9+()\- ]+$/)
    .required()
    .messages({
      "string.empty": "Phone number is required",
      "any.required": "Phone number is required",
      "string.pattern.base": "Enter a valid phone number with digits, +, spaces, (), or -"
    }),

  inquiryType: Joi.string()
    .valid("General", "Partnership", "Support", "Quote")
    .required()
    .messages({
      "any.only": "Please select a valid inquiry type",
      "string.empty": "Inquiry Type is required",
      "any.required": "Inquiry Type is required"
    }),

  note: Joi.string()
    .required()
    .messages({
      "string.empty": "Description is required",
      "any.required": "Description is required"
    })
    }).required()
});


module.exports.faqSchema = Joi.object({
  question: Joi.string().required().messages({
    "string.empty": "Question cannot be empty",
    "any.required": "Question is required"
  }),
  answer: Joi.string().required().messages({
    "string.empty": "Answer cannot be empty",
    "any.required": "Answer is required"
  })
});

module.exports.reviewSchema = Joi.object({
  clientName: Joi.string()
    .required()
    .messages({
      'any.required': 'Client name is required.',
      'string.empty': 'Client name cannot be empty.'
    }),

  clientReview: Joi.string()
    .required()
    .messages({
      'any.required': 'Client review is required.',
      'string.empty': 'Client review cannot be empty.'
    }),

removePhoto: Joi.string().optional() //Already defined a check inside controller for hidden input

});