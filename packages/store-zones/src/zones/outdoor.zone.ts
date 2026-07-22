import { defineZone } from '../contracts'
export default defineZone({ key:'outdoor', name:'Extérieurs', description:'Espaces ouverts, circulation extérieure et abords du magasin.', icon:'🌳', color:0x84cc16, order:40, costs:{ electricityPerCell:.05, cleaningPerCell:.1, maintenancePerCell:.08, securityPerCell:.03 }, constraints:{ indoor:false }, allowedBuildingCategories:['wall','door'] })
