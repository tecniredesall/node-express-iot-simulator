var express = require('express');
var router = express.Router();
const fs = require('fs');

// *** NOTE: it's just for testing purposes
router.delete('/reset-metrics', async function (req, res) {
    const { total, bad } = req.query;
    const filepath = './servers/test-db.json';
    if(total != undefined && bad != undefined)
    {
        const data = JSON.stringify({
            total: parseFloat(total),
            bad: parseFloat(bad),
        },null, 3);
        fs.writeFileSync(filepath, data);
    }
    else
    {
        console.log('dropped');
        fs.access(filepath, fs.F_OK, (err) => {
            if(!err)
            {    
                fs.unlinkSync(filepath)
            }
        })
    }
    res.json(200, {'success': true});
});
  
module.exports = router;