package db.migration;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.util.UUID;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Ensures {@code users} exists before Hibernate runs (Flyway runs first), then seeds platform super admin if missing.
 * <p>
 * <strong>Important:</strong> Do not wrap {@code context.getConnection()} in try-with-resources or call
 * {@code Connection#close()} — Flyway owns the connection and transaction lifecycle. Closing it causes
 * "Connection is closed" / rollback failures.
 * <p>
 * Dev seed (change password in production): Nagendra, lvvnagendra99@gmail.com (password in constant below).
 */
public class V1__Bootstrap_users_and_super_admin extends BaseJavaMigration {

    private static final String SUPER_ADMIN_EMAIL = "lvvnagendra99@gmail.com";
    private static final String SUPER_ADMIN_NAME = "Nagendra";
    private static final String SUPER_ADMIN_PASSWORD = "Nani@143";
    private static final UUID SUPER_ADMIN_ID = UUID.fromString("f47ac10b-58cc-4372-a567-0e02b2c3d479");

    @Override
    public void migrate(Context context) throws Exception {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);
        String passwordHash = encoder.encode(SUPER_ADMIN_PASSWORD);

        Connection c = context.getConnection();
        try (Statement st = c.createStatement()) {
            st.execute(
                    """
                    CREATE TABLE IF NOT EXISTS users (
                        id UUID NOT NULL PRIMARY KEY,
                        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
                        updated_at TIMESTAMP WITH TIME ZONE NOT NULL,
                        email VARCHAR(255) NOT NULL,
                        mobile VARCHAR(32),
                        password_hash VARCHAR(255) NOT NULL,
                        name VARCHAR(200) NOT NULL,
                        role VARCHAR(32) NOT NULL,
                        status VARCHAR(32) NOT NULL
                    )
                    """);
        }
        try (Statement st = c.createStatement()) {
            st.execute("CREATE UNIQUE INDEX IF NOT EXISTS uk_users_email ON users (email)");
        }

        try (var check = c.prepareStatement("SELECT 1 FROM users WHERE LOWER(email) = LOWER(?)")) {
            check.setString(1, SUPER_ADMIN_EMAIL);
            try (ResultSet rs = check.executeQuery()) {
                if (rs.next()) {
                    return;
                }
            }
        }

        Instant now = Instant.now();
        try (var ins =
                c.prepareStatement(
                        """
                        INSERT INTO users (id, created_at, updated_at, email, mobile, password_hash, name, role, status)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """)) {
            ins.setObject(1, SUPER_ADMIN_ID);
            ins.setTimestamp(2, Timestamp.from(now));
            ins.setTimestamp(3, Timestamp.from(now));
            ins.setString(4, SUPER_ADMIN_EMAIL.toLowerCase());
            ins.setNull(5, Types.VARCHAR);
            ins.setString(6, passwordHash);
            ins.setString(7, SUPER_ADMIN_NAME);
            ins.setString(8, "SUPER_ADMIN");
            ins.setString(9, "ACTIVE");
            ins.executeUpdate();
        }
    }
}
