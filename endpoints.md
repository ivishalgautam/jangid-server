<!-- workers endpoints with authorization in headers -->

POST:"/api/workers" <!-- { fullname, phone, docs, site_assigned, password, profile_img } change -->
GET:"/api/workers" <!-- fetch all the worker -->
GET:"/api/workers/:workerId" <!-- fetch all the worker -->
PUT:"/api/workers/:workerId" <!-- updates a worker -->
DELETE:"/api/workers/:workerId" <!-- deletes a worker -->

<!-- sites endpoints -->

POST:"/api/sites" <!-- { site_name, owner_name, address, supervisor_id } -->
GET:"/api/sites" <!-- fetch all the sites -->
GET:"/api/sites/:siteId" <!-- fetch all the sites -->
PUT:"/api/sites/:siteId" <!-- updates a sites -->
DELETE:"/api/sites/:siteId" <!-- deletes a sites -->

<!-- wallets endpoints -->

POST:"/api/wallets" <!-- { amount, supervisor_id } -->
GET:"/api/wallets" <!-- fetch all the wallet -->
GET:"/api/wallets/:walletId" <!-- fetch all the wallet -->
PUT:"/api/wallets/:walletId" <!-- updates a wallet -->
DELETE:"/api/wallets/:walletId" <!-- deletes a wallet -->

<!-- expenses endpoints -->

POST:"/api/expenses" <!-- { amount, purpose, site_id, worker_id } -->
GET:"/api/expenses" <!-- fetch all the expense -->
GET:"/api/expenses/:expenseId" <!-- fetch all the expense -->
PUT:"/api/expenses/:expenseId" <!-- updates a expense -->
DELETE:"/api/expenses/:expenseId" <!-- deletes a expense -->
