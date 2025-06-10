window.onload = async () => {
  try {
    const response = await fetch('/api/users');
    const users = await response.json();

    const tbody = document.querySelector('#user-table tbody');
    let total = 0;

    users.forEach(user => {
      const tr = document.createElement('tr');

      const tdAccount = document.createElement('td');
      tdAccount.textContent = user.username;
      tr.appendChild(tdAccount);

      const tdNickname = document.createElement('td');
      tdNickname.textContent = user.nickname;
      tr.appendChild(tdNickname);

      const tdBalance = document.createElement('td');
      tdBalance.textContent = `$${user.balance}`;
      tr.appendChild(tdBalance);

      tbody.appendChild(tr);

      total += user.balance;
    });

    document.getElementById('total-amount').textContent = `$${total}`;
  } catch (err) {
    console.error('載入資料失敗', err);
  }
};