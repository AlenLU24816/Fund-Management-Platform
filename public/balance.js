window.onload = async () => {
  const params = new URLSearchParams(window.location.search);
  const username = params.get('user');

  if (!username) {
    alert('缺少使用者資訊');
    return;
  }

  document.getElementById('addBtn').addEventListener('click', () => handleTransaction('deposit', username));
  document.getElementById('withdrawBtn').addEventListener('click', () => handleTransaction('withdraw', username));

  await fetchBalance(username);
};

async function fetchBalance(username) {
  try {
    const res = await fetch(`/api/balance?user=${encodeURIComponent(username)}`);
    const data = await res.json();
    document.getElementById('balanceDisplay').textContent = `你目前的餘額是：$${parseFloat(data.balance).toFixed(2)}`;
  } catch (err) {
    console.error('無法讀取金額', err);
    document.getElementById('balanceDisplay').textContent = '無法讀取餘額';
  }
}

async function handleTransaction(type, username) {
  const amountInput = document.getElementById('amountInput');
  const message = document.getElementById('message');
  const amount = parseFloat(amountInput.value);

  if (isNaN(amount) || amount <= 0) {
    message.textContent = '請輸入有效金額';
    return;
  }

  try {
    const res = await fetch(`/api/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, amount })
    });

    const data = await res.json();
    if (res.ok) {
      await fetchBalance(username); // 更新顯示餘額
      message.style.color = 'green';
      message.textContent = `${type === 'deposit' ? '加值' : '提款'}成功`;
    } else {
      message.style.color = 'red';
      message.textContent = data.error || '操作失敗';
    }
  } catch (err) {
    console.error('錯誤:', err);
    message.style.color = 'red';
    message.textContent = '操作失敗';
  }
}
