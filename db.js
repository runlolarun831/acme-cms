const Sequelize = require('sequelize');
const { UUID, UUIDV4, STRING } = Sequelize;

const conn = new Sequelize(process.env.DATABASE_URL || 'postgres://localhost/acme_cms_db');

const Page = conn.define('page', {
  id: {
    primaryKey: true,
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  parentId: {
    primaryKey: true,
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    allowNull: true
  }
});

//works
Page.findHomePage = function(){
  return this.findOne({ where: {title: 'Home Page'}});
}
//works
Page.prototype.findChildren = function () {
  return Page.findAll({ where: {parentId: this.id }})
}
//test
 Page.prototype.hierarchy = function () {
   return Page.findAll({where: {parentId: this.parentId }})//[ 'Phone', 'Fax' ]
 };

 Page.prototype.hierarchy = function () {
  return Page.findAll({where: {parentId: this.parentId }})
};

// Page.prototype.hierarchy = function () {
//   return Page.findAll( {
//     //where: {parentId: this.parentId },
//     include: [{
//      model: Page,
//      as: 'parents',
//      where: { id: this.ParentId.parentId}
//     }]
// })

}
// Page.prototype.hierarchy = function () {
//   return hierarchy(Page.findAll({where: { where: { id: this.parentId }}}))//
// };
Page.belongsTo(Page, {as: 'parent'});
Page.hasMany(Page, {as: 'parents', foreignKey: 'parentId'});

const mapAndSave = (pages) => Promise.all(pages.map( page => Page.create(page)));

const syncAndSeed = async() => {
  await conn.sync({ force: true });//I changed connect to conn
  const home = await Page.create({ title: 'Home Page' });
  let pages = [
    { title: 'About', parentId: home.id },
    { title: 'Contact', parentId: home.id }
  ];
  const [ about, contact ] = await mapAndSave(pages);
  pages = [
    { title: 'About Our Team', parentId: about.id },
    { title: 'About Our History', parentId: about.id },
    { title: 'Phone', parentId: contact.id },
    { title: 'Fax', parentId: contact.id },
  ];
  const [ team, history, phone, fax ] = await mapAndSave(pages);
};

syncAndSeed()
  .then(async() => {
    const home = await Page.findHomePage();
    console.log(home.title); //Home Page
    const homeChildren = await home.findChildren();
    console.log(homeChildren.map( page => page.title)); //[About, Contact];
    const fax = await Page.findOne({ where: {title: 'Fax' }});
    console.log(fax.title);
    //hierarch returns the page, parentPage, parent's Parent... etc..
    let hier = await fax.hierarchy();
    console.log(hier.map( page => page.title)); //['Fax', 'Contact', 'Home']
    const history = await Page.findOne({ where: {title: 'About Our History' }});// fixed typo to lwrcase i
    hier = await history.hierarchy();
    console.log(hier.map( page => page.title));//[ 'About Our History', 'About', 'Home Page' ]
  });

module.exports = {
  syncAndSeed,
  models: {
    Page
  }
}
