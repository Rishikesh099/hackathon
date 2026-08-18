const user = JSON.parse(localStorage.getItem('user') || 'null');
const token = localStorage.getItem('token') || localStorage.getItem('jwt_token');

if (!token) {
	window.location.replace('/');
} else {
	const heading = document.getElementById('welcome-heading');
	const email = document.getElementById('student-email');
	const displayName = user && (user.name || user.email);

	if (displayName) {
		heading.textContent = `Welcome${user.name ? `, ${user.name}` : ''}`;
		email.textContent = user.email || 'Signed-in student';
	}
}

document.getElementById('logout-btn').addEventListener('click', () => {
	localStorage.removeItem('token');
	localStorage.removeItem('jwt_token');
	localStorage.removeItem('user');
	window.location.replace('/');
});
