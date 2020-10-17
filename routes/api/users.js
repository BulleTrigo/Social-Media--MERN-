const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require("config");
const { check, validationResult } = require('express-validator')

const User = require('../../models/User');
const { estimatedDocumentCount } = require('../../models/User');

// @route   POST api/user
// @desc    TEST route
// @access  Public
router.post('/', [
    check('name', 'Name is required')
        .not()
        .isEmpty(),
    check('email','Enter a valid email').isEmail(),
    check(
        'password',
        'Enter a Password with 8 or mre Characterws'
    ).isLength({ min:8 })
], 
async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {

        // See if the user exist 

        let user = await User.findOne({ email });
              
        if(user) {
            return res.status(400).json({ error: [ { msg: 'User Already Exists' } ] });
        }

        // Get users Gravatar

        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        })

        user = new User({
            name,
            email,
            avatar,
            password
        });

        // Encrypt the Password

        const salt = await bcrypt.genSalt(10);

        user.password = await bcrypt.hash(password, salt);

        await user.save();

        // Return jsonwebtoken 

        const payload = {
            user: {
                id: user.id
            }
        }

        jwt.sign(
            payload, 
            config.get('jwtSecret'),
            { expiresIn: 360000 },
            (err, token) => {
                if(err) throw err;
                res.json({ token });
            }
        );
        
    } catch (error) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
    
   
}
);

module.exports = router;